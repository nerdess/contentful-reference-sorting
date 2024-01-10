
const umlautMap: Record<string, string> = {
    'ä': 'a',
    'ö': 'o',
    'ü': 'u',
};

export const replaceUmlautsWithVowels = (str: string) =>{
    return str.replace(/[äöü]/g, match => umlautMap[match] || match);
}