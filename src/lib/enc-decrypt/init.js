export const generateKeyByCustId = (customerId) => {
  const defaultCustomerId = process.env.NEXT_PUBLIC_DEFAULT_CUSTOMERID;

  let customerIdLocal, productWithCidAndLastDigit;
  if (customerId) {
    customerIdLocal = customerId;
  } else {
    customerIdLocal = defaultCustomerId;
  }

  const lastDigit = customerIdLocal % 10;
  if (lastDigit) {
    productWithCidAndLastDigit = lastDigit * customerIdLocal;
  } else {
    productWithCidAndLastDigit = 9 * customerIdLocal;
  }

  const appendedProductString = `${productWithCidAndLastDigit}${productWithCidAndLastDigit}`;
  const keySliced = appendedProductString.slice(0, 16);

  return keySliced;
};

export const generateInitVectorByCustId = (customerId) => {
  const defaultCustomerId = process.env.NEXT_PUBLIC_DEFAULT_CUSTOMERID;

  let customerIdLocal;
  if (customerId) {
    customerIdLocal = customerId;
  } else {
    customerIdLocal = defaultCustomerId;
  }

  const appendedCustomerIdString = `${customerIdLocal}${customerIdLocal}`;
  const initVectorSliced = appendedCustomerIdString.slice(0, 16);
  return initVectorSliced;
};
