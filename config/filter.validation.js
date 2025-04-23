function filterValid(docs, validateFn, label) {
    return docs.reduce((acc, doc, i) => {
      if (validateFn(doc)) {
        acc.push(doc);
      } else {
        console.warn(`${label} inválido en ${i}:`, validateFn.errors);
      }
      return acc;
    }, []);
  }
  module.exports = { filterValid };