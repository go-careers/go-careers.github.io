function getImgUrl(name: string) {
  return new URL(
    `../assets/home-page-assets/category-icons/${name}`,
    import.meta.url
  ).href;
}

export { getImgUrl };
