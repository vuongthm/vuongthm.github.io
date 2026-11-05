/** Accent-insensitive search shared by Vietnamese names and chapter titles. */
export function searchText(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").replace(/[đĐ]/g, "d").toLowerCase().trim()
}
