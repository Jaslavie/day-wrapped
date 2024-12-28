/**
 * Function to get the time of the day and return a greeting
 */

export const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning, ";
    if (hour < 18) return "Good afternoon, ";
    return "Nighttime Grind, ";
}