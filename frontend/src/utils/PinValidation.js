// Func for handling message validations
export const getValidationError = (message) => {
  // Validation for empty message
  if (!message || message.length === 0) {
    return "Zpráva nesmí být prázdná";
  }

  // Validation for length
  if (message.length > 1000) {
    return "Zpráva je moc dlouhá (max 1000 znaků)";
  }

  // Validation for forbidden chars
  const allowedChars = /^[a-zA-Z0-9á-žÁ-Ž\s@.!?,\-]+$/;
  if (!allowedChars.test(message)) {
    return "Zakázané znaky (pouze povolené @.!?,-)";
  }

  // No errors found
  return "";
};
