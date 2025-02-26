
import type { Record } from "../types/emailTest";

export const getRecordLabel = (record: Record): string => {
  if ('client' in record) {
    return `${record.client.name} - ${record.description}`;
  }
  return record.name;
};
