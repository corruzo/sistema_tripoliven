export const normalizeApiListResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray(data.data)) return data.data;
  return [];
};

export const isApiListResponse = (data) => {
  return Array.isArray(data) || (data && typeof data === 'object' && Array.isArray(data.data));
};
