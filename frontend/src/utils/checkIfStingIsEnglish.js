export const checkIfEnglish = (string) => {
    const englishRegex = /^[A-Za-z\s]+$/;
    return englishRegex.test(string) ? "by " : ''
}