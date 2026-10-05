export function filterDestinations(destinations, { query = '', category = '全部' } = {}) {
  const keywords = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return destinations.filter(destination => {
    const matchesCategory = category === '全部' || destination.categories.includes(category);
    const searchable = [destination.name, destination.region, destination.english, ...destination.tags]
      .join(' ').toLocaleLowerCase();
    return matchesCategory && keywords.every(keyword => searchable.includes(keyword));
  });
}
