module.exports = {
    sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
    extractInspectURL: inspectURL => {
        let matches = false;

        if ((matches = String(inspectURL).toUpperCase().trim().match(/([SM])(\d+)A(\d+)D(\d+)$/)) && matches) {
            return {
                s: matches[1] == 'S' ? matches[2] : 0,
                a: matches[3],
                d: matches[4],
                m: matches[1] == 'M' ? matches[2] : 0
            }
        }

        return null;
    }
}
