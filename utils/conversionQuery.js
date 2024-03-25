function parseComparisonQuery(queryString) {
  const operators = [">=", ">", "<=", "<", "&lt;"];
  let operator;

  for (const op of operators) {
    if (queryString.includes(op)) {
      operator = op;
      break;
    }
  }

  if (!operator) {
    throw new Error("Invalid comparison operator");
  }

  const key = Object.values(JSON.parse(queryString));
  const [field, valueStr] = queryString.split(operator);
  const value = parseInt(key[0] || valueStr);

  const mongoOperator =
    operator === ">" && key[0]
      ? "$gte"
      : operator === ">"
      ? "$gt"
      : operator === "&lt;" && key[0]
      ? "$lte"
      : "$lt";

  const query = {};
  const [fieldStr, valueField] = field.split('"');
  query[valueField] = { [mongoOperator]: value };

  return query;
}

module.exports = parseComparisonQuery;
