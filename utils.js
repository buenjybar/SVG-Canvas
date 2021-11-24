function readJson() {
  return fetch("./data.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      return response.json();
    })
    .then((json) => {
      // convert raw data to [Float64Array, Float64Array] data
      const raw = json["data"];

      const leadNames = Object.keys(raw);
      const n = leadNames.length;
      const size = raw[leadNames[0]].length;

      const data = {};
      for (let i = 0; i < n; ++i) {
        const name = leadNames[i];
        const d = (data[name] = new Float64Array(size));
        for (let j = 0; j < size; ++j) {
          d[j] = raw[name][j];
        }
      }
      return data;
    })
    .catch(function (err) {
      console.error(err);
    });
}
