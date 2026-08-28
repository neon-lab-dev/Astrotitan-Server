import jwt from "jsonwebtoken";

type ZoomRoleType = 0 | 1;

interface IGenerateTokenParams {
  sessionName: string;
  roleType: ZoomRoleType;
}

class ZoomVideoService {
  private readonly sdkKey =
    process.env.ZOOM_VIDEO_SDK_KEY;

  private readonly sdkSecret =
    process.env.ZOOM_VIDEO_SDK_SECRET;

  private validateCredentials() {
    if (!this.sdkKey || !this.sdkSecret) {
      throw new Error(
        "Zoom Video SDK credentials are not configured"
      );
    }
  }

  generateSessionName(
    consultationId: string
  ): string {
    return `astro_${consultationId}`;
  }

  generateToken({
    sessionName,
    roleType,
  }: IGenerateTokenParams): string {
    this.validateCredentials();

    const sdkSecret = this.sdkSecret;
    const sdkKey = this.sdkKey;

    if (!sdkSecret || !sdkKey) {
      throw new Error(
        "Zoom Video SDK credentials are not configured"
      );
    }

    const iat =
      Math.floor(Date.now() / 1000) - 30;

    const exp =
      iat + 60 * 60 * 2;

    const payload = {
      app_key: sdkKey,
      tpc: sessionName,
      role_type: roleType,
      version: 1,
      iat,
      exp,
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