export function chunk(array, size) {
  return [...Array(Math.ceil(array.length / size))].map((_, index) =>
    array.slice(index * size, (index + 1) * size)
  );
}
