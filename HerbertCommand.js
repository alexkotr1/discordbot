class HerbertCommand {
    constructor(name, description, hasPermission, run) {
        this.name = name;
        this.description = description;
        this.hasPermission = hasPermission;
        this.run = run;
    }
}


module.exports = HerbertCommand