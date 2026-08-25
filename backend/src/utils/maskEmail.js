function maskEmail(email) {
    const [user, domain] = email.split("@");
    if (user.length <= 2) {
        return email;
    }
    const maskedUser = user[0] + "*".repeat(user.length - 2) + user.slice(-1);
    return maskedUser + "@" + domain;
}
export { maskEmail };