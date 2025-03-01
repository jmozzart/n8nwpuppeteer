"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const config_1 = require("@n8n/config");
const crypto_1 = require("crypto");
const jsonwebtoken_1 = require("jsonwebtoken");
const typedi_1 = __importStar(require("typedi"));
const config_2 = __importDefault(require("../config"));
const constants_1 = require("../constants");
const invalid_auth_token_repository_1 = require("../databases/repositories/invalid-auth-token.repository");
const user_repository_1 = require("../databases/repositories/user.repository");
const auth_error_1 = require("../errors/response-errors/auth.error");
const forbidden_error_1 = require("../errors/response-errors/forbidden.error");
const license_1 = require("../license");
const logger_service_1 = require("../logging/logger.service");
const jwt_service_1 = require("../services/jwt.service");
const url_service_1 = require("../services/url.service");
const restEndpoint = typedi_1.default.get(config_1.GlobalConfig).endpoints.rest;
const skipBrowserIdCheckEndpoints = [
    `/${restEndpoint}/push`,
    `/${restEndpoint}/binary-data/`,
    `/${restEndpoint}/oauth1-credential/callback`,
    `/${restEndpoint}/oauth2-credential/callback`,
];
let AuthService = class AuthService {
    constructor(logger, license, jwtService, urlService, userRepository, invalidAuthTokenRepository) {
        this.logger = logger;
        this.license = license;
        this.jwtService = jwtService;
        this.urlService = urlService;
        this.userRepository = userRepository;
        this.invalidAuthTokenRepository = invalidAuthTokenRepository;
        this.authMiddleware = this.authMiddleware.bind(this);
    }
    async authMiddleware(req, res, next) {
        const token = req.cookies[constants_1.AUTH_COOKIE_NAME];
        if (token) {
            try {
                const isInvalid = await this.invalidAuthTokenRepository.existsBy({ token });
                if (isInvalid)
                    throw new auth_error_1.AuthError('Unauthorized');
                req.user = await this.resolveJwt(token, req, res);
            }
            catch (error) {
                if (error instanceof jsonwebtoken_1.JsonWebTokenError || error instanceof auth_error_1.AuthError) {
                    this.clearCookie(res);
                }
                else {
                    throw error;
                }
            }
        }
        if (req.user)
            next();
        else
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
    clearCookie(res) {
        res.clearCookie(constants_1.AUTH_COOKIE_NAME);
    }
    async invalidateToken(req) {
        const token = req.cookies[constants_1.AUTH_COOKIE_NAME];
        if (!token)
            return;
        try {
            const { exp } = this.jwtService.decode(token);
            if (exp) {
                await this.invalidAuthTokenRepository.insert({
                    token,
                    expiresAt: new Date(exp * 1000),
                });
            }
        }
        catch (e) {
            this.logger.warn('failed to invalidate auth token', { error: e.message });
        }
    }
    issueCookie(res, user, browserId) {
        const isWithinUsersLimit = this.license.isWithinUsersLimit();
        if (config_2.default.getEnv('userManagement.isInstanceOwnerSetUp') &&
            !user.isOwner &&
            !isWithinUsersLimit) {
            throw new forbidden_error_1.ForbiddenError(constants_1.RESPONSE_ERROR_MESSAGES.USERS_QUOTA_REACHED);
        }
        const token = this.issueJWT(user, browserId);
        res.cookie(constants_1.AUTH_COOKIE_NAME, token, {
            maxAge: this.jwtExpiration * constants_1.Time.seconds.toMilliseconds,
            httpOnly: true,
            sameSite: 'lax',
            secure: config_2.default.getEnv('secure_cookie'),
        });
    }
    issueJWT(user, browserId) {
        const payload = {
            id: user.id,
            hash: this.createJWTHash(user),
            browserId: browserId && this.hash(browserId),
        };
        return this.jwtService.sign(payload, {
            expiresIn: this.jwtExpiration,
        });
    }
    async resolveJwt(token, req, res) {
        const jwtPayload = this.jwtService.verify(token, {
            algorithms: ['HS256'],
        });
        const user = await this.userRepository.findOne({
            where: { id: jwtPayload.id },
        });
        if (!user ||
            user.disabled ||
            jwtPayload.hash !== this.createJWTHash(user)) {
            throw new auth_error_1.AuthError('Unauthorized');
        }
        const endpoint = req.route ? `${req.baseUrl}${req.route.path}` : req.baseUrl;
        if (req.method === 'GET' && skipBrowserIdCheckEndpoints.includes(endpoint)) {
            this.logger.debug(`Skipped browserId check on ${endpoint}`);
        }
        else if (jwtPayload.browserId &&
            (!req.browserId || jwtPayload.browserId !== this.hash(req.browserId))) {
            this.logger.warn(`browserId check failed on ${endpoint}`);
            throw new auth_error_1.AuthError('Unauthorized');
        }
        if (jwtPayload.exp * 1000 - Date.now() < this.jwtRefreshTimeout) {
            this.logger.debug('JWT about to expire. Will be refreshed');
            this.issueCookie(res, user, req.browserId);
        }
        return user;
    }
    generatePasswordResetToken(user, expiresIn = '20m') {
        const payload = { sub: user.id, hash: this.createJWTHash(user) };
        return this.jwtService.sign(payload, { expiresIn });
    }
    generatePasswordResetUrl(user) {
        const instanceBaseUrl = this.urlService.getInstanceBaseUrl();
        const url = new URL(`${instanceBaseUrl}/change-password`);
        url.searchParams.append('token', this.generatePasswordResetToken(user));
        url.searchParams.append('mfaEnabled', user.mfaEnabled.toString());
        return url.toString();
    }
    async resolvePasswordResetToken(token) {
        let decodedToken;
        try {
            decodedToken = this.jwtService.verify(token);
        }
        catch (e) {
            if (e instanceof jsonwebtoken_1.TokenExpiredError) {
                this.logger.debug('Reset password token expired', { token });
            }
            else {
                this.logger.debug('Error verifying token', { token });
            }
            return;
        }
        const user = await this.userRepository.findOne({
            where: { id: decodedToken.sub },
            relations: ['authIdentities'],
        });
        if (!user) {
            this.logger.debug('Request to resolve password token failed because no user was found for the provided user ID', { userId: decodedToken.sub, token });
            return;
        }
        if (decodedToken.hash !== this.createJWTHash(user)) {
            this.logger.debug('Password updated since this token was generated');
            return;
        }
        return user;
    }
    createJWTHash({ email, password }) {
        return this.hash(email + ':' + password).substring(0, 10);
    }
    hash(input) {
        return (0, crypto_1.createHash)('sha256').update(input).digest('base64');
    }
    get jwtRefreshTimeout() {
        const { jwtRefreshTimeoutHours, jwtSessionDurationHours } = config_2.default.get('userManagement');
        if (jwtRefreshTimeoutHours === 0) {
            return Math.floor(jwtSessionDurationHours * 0.25 * constants_1.Time.hours.toMilliseconds);
        }
        else {
            return Math.floor(jwtRefreshTimeoutHours * constants_1.Time.hours.toMilliseconds);
        }
    }
    get jwtExpiration() {
        return config_2.default.get('userManagement.jwtSessionDurationHours') * constants_1.Time.hours.toSeconds;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        license_1.License,
        jwt_service_1.JwtService,
        url_service_1.UrlService,
        user_repository_1.UserRepository,
        invalid_auth_token_repository_1.InvalidAuthTokenRepository])
], AuthService);
//# sourceMappingURL=auth.service.js.map