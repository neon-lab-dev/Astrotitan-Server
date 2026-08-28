import jwt from "jsonwebtoken";

type ZoomRoleType = 0 | 1;

interface IGenerateTokenParams {
  sessionName: string;
  userKey: string;
  roleType: ZoomRoleType;
}

class ZoomVideoService {
  private readonly sdkKey = process.env.ZOOM_VIDEO_SDK_KEY;
  private readonly sdkSecret =
    process.env.ZOOM_VIDEO_SDK_SECRET;

  private validateCredentials() {
    if (!this.sdkKey || !this.sdkSecret) {
      throw new Error(
        "Zoom Video SDK credentials are not configured"
      );
    }
  }

  generateSessionName(consultationId: string): string {
    return `astro_${consultationId}`;
  }

  generateSessionPassword(): string {
    return Math.random()
      .toString(36)
      .substring(2, 12);
  }

  generateToken({
    sessionName,
    userKey,
    roleType,
  }: IGenerateTokenParams): string {
    this.validateCredentials();

    const sdkSecret = this.sdkSecret;
    if (!sdkSecret) {
      throw new Error(
        "Zoom Video SDK credentials are not configured"
      );
    }

    const issuedAt = Math.floor(
      Date.now() / 1000
    );

    const expiration = issuedAt + 2 * 60 * 60;

    const payload = {
      app_key: this.sdkKey,
      role_type: roleType,
      tpc: sessionName,
      version: 1,
      iat: issuedAt,
      exp: expiration,
      user_key: userKey,
    };

    return jwt.sign(
      payload,
      sdkSecret,
      {
        algorithm: "HS256",
      }
    );
  }
}

export default new ZoomVideoService();