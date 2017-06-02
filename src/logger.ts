/**
 * Created by wenchun on 1/30/17.
 */

export class Logger {

    public LOG_ERROR: string = "ERROR";

    public LOG_WARN: string = "WARN";

    public LOG_INFO: string = "INFO";

    public LOG_DEBUG: string = "DEBUG";

    logLevel: string;

    levels = [this.LOG_DEBUG, this.LOG_INFO, this.LOG_WARN, this.LOG_ERROR];

    constructor() {
        this.logLevel = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : this.LOG_DEBUG;

    }

    public log(level, user, fileName, message) {
        if (this.isPrint(level)) {
            let date = this.ISODateString(new Date());
            console.log(date + " " + level + " [user:" + user + "] " + " " + message);
        }
    }

    public debug(user, message) {
        if (this.isPrint(this.LOG_DEBUG)) {
            let date = this.ISODateString(new Date());
            console.log(date + " " + this.LOG_DEBUG + " [user:" + user + "] " + " " + message);
        }
    }

    public info(user, message) {
        if (this.isPrint(this.LOG_INFO)) {
            let date = this.ISODateString(new Date());
            console.log(date + " " + this.LOG_INFO + " [user:" + user + "] " + " " + message);
        }
    }

    public warn(user, message) {
        if (this.isPrint(this.LOG_WARN)) {
            let date = this.ISODateString(new Date());
            console.log(date + " " + this.LOG_WARN + " [user:" + user + "] " + " " + message);
        }
    }

    public error(user, message) {
        if (this.isPrint(this.LOG_ERROR)) {
            let date = this.ISODateString(new Date());
            console.log(date + " " + this.LOG_ERROR + " [user:" + user + "] " + " " + message);
        }
    }

    private isPrint(level) {
        return (this.levels.indexOf(level.toUpperCase()) >= this.levels.indexOf(this.logLevel));
    }

    private pad(number) {
        if (number < 10) {
            return "0" + number;
        }
        return number;
    }


    private pad2(number) {
        if (number < 10) {
            return "0" + number;
        } else if (number < 100) {
            return "00" + number;
        }
        return number;
    }

    private formatDate(date) {
        // yyyy-MM-dd HH:mm:ss.SSS
        return date.getUTCFullYear() +
            "-" + this.pad(date.getUTCMonth() + 1) +
            "-" + this.pad(date.getUTCDate()) +
            " " + this.pad(date.getUTCHours()) +
            ":" + this.pad(date.getUTCMinutes()) +
            ":" + this.pad(date.getUTCSeconds()) +
            "." + this.pad2(date.getUTCMilliseconds());
    }

    private ISODateString(d) {

        return d.getUTCFullYear() + "-"
            + this.pad(d.getUTCMonth() + 1) + "-"
            + this.pad(d.getUTCDate()) + "T"
            + this.pad(d.getUTCHours()) + ":"
            + this.pad(d.getUTCMinutes()) + ":"
            + this.pad(d.getUTCSeconds()) + "Z";
    }

}

