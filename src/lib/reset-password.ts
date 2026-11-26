export function getResetPasswordRequirements(password: string) {
  return {
    length: password.length >= 8,
    letterAndNumber: /[a-z]/i.test(password) && /\d/.test(password),
  };
}

export function isValidResetPassword(password: string) {
  const requirements = getResetPasswordRequirements(password);
  return requirements.length && requirements.letterAndNumber;
}
