import { User } from "@prisma/client";

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        buffer: Buffer;
        originalname: string;
        mimetype: string;
        size: number;
      }
    }

    interface Request {
      user?: User;
    }
  }
}
