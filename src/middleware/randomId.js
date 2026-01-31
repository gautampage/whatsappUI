import ShortUniqueId from "short-unique-id";
export const { randomUUID } = new ShortUniqueId({
  length: 5,
  dictionary: "alphanum_lower",
});

export const randomNumberString = (n) => {
  const { randomUUID } = new ShortUniqueId({
    length: n,
    dictionary: "number",
  });
  return randomUUID();
};

export default { randomUUID };
