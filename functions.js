function decircleJSON(circ, stringify, tab) {
  var cache = [];
  if (stringify) {
    return JSON.stringify(
      circ,
      (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (cache.includes(value)) return;

          cache.push(value);
        }
        return value;
      },
      tab
    );
  }
  return JSON.parse(
    JSON.stringify(circ, (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (cache.includes(value)) return;

        cache.push(value);
      }
      return value;
    })
  );
}

module.exports = {
  decircleJSON,
};