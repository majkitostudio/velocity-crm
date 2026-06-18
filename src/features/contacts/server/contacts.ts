import type { Contact } from "@/src/generated/prisma/client";

export {
  assertContactAccess,
  createContact,
  getContactById,
  getContactDetailById,
} from "./contacts.service";

export type { Contact };
