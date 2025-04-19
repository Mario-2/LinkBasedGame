class Start extends Scene {
    create() {
        this.engine.setTitle(this.engine.storyData.Title);
        this.engine.addChoice("Begin the story");
    }

    handleChoice() {
        this.engine.gotoScene(Location, this.engine.storyData.InitialLocation);
    }
}

class Location extends Scene {
    create(key) {
        let locationData = this.engine.storyData.Locations[key];
        if(this.engine.storyData.Variables.Lamp_Lit && locationData.Body_Lamp) {
            this.engine.show(locationData.Body_Lamp); // if lamp is lit, display different body text
        }
        else { 
            this.engine.show(locationData.Body);
        }
        
        if(locationData.Choices) {
            for(let choice of locationData.Choices) {
                if(choice.Lamp && !this.engine.storyData.Variables.Lamp_Lit) {
                    continue; // lamp is unlit and choice requires the lamp to be lit
                }
                if(choice.Rat && choice.Rat != this.engine.storyData.Variables.Rat_Puzzle) {
                    continue; //check rat puzzle stage
                }
                if(choice.Lock){
                    if(this.engine.storyData.Inventory.includes(choice.Lock)) {
                        this.engine.addChoice(choice.Text, choice); // choice requires a lock
                    }
                }
                else if(choice.Item){
                    if(!this.engine.storyData.Inventory.includes(choice.Item)) {
                        this.engine.addChoice(choice.Text, choice); // choice gives an item, hide if obtained
                    }
                }
                else {
                    this.engine.addChoice(choice.Text, choice);
                }
            }
            for(let item of this.engine.storyData.Inventory) {
                let itemClass = itemClasses[item];
                if(itemClass) {
                    new itemClass(this.engine, key); // if an item has a class on the itemClasses dictionary, create an instance of that item
                }
            }
        } else {
            this.engine.addChoice("The end.")
        }
    }

    handleChoice(choice) {
        if(choice) {
            if(choice.Item) {
                this.engine.storyData.Inventory.push(choice.Item); // choice grants an item
            }
            if(choice.Variable) {
                this.engine.storyData.Variables[choice.Variable] = choice.Var_Value; // update a variable defined in the choice (used for the lamp and rat puzzle)
            }
            this.engine.show("&gt; "+choice.Text);
            if(choice.Target == "Door"){
                this.engine.gotoScene(Door, choice.Target); // load the special door scene
            }
            else {
                this.engine.gotoScene(Location, choice.Target);
            }
        } else {
            this.engine.gotoScene(End);
        }
    }
}

class End extends Scene {
    create() {
        this.engine.show("<hr>");
        this.engine.show(this.engine.storyData.Credits);
    }
}

class Door extends Location { // used for the door puzzle location

    create(key) {
        this.correct = true;
        this.index = 1;
        this.engine.show(this.engine.storyData.Locations.Door.Body);
        this.progressPuzzle();
    }

    puzzleFinish() {
        if(this.correct == true) {
            this.engine.gotoScene(Location, "Door_Win"); // all 3 choices were correct
        }
        else {
            this.engine.gotoScene(Location, "Door_Fail"); // one or more choices were incorrect
        }
    }

    progressPuzzle() {
        if(this.index > 3) {
            this.puzzleFinish();
            return;
        }
        let locationData = this.engine.storyData.Locations.Door;

        let choices = "Choices_Puzzle_" + this.index;
        for(let choice of locationData[choices]) {
            this.addChoicePuzzle(choice.Text, choice); // display choices based on the index value
        }
    }

    addChoicePuzzle(action, data) {
        let button = this.engine.actionsContainer.appendChild(document.createElement("button"));
        button.innerText = action;
        button.onclick = () => {
            while(this.engine.actionsContainer.firstChild) {
                this.engine.actionsContainer.removeChild(this.engine.actionsContainer.firstChild)
            }
            this.handleChoicePuzzle(data);
        }
    }

    handleChoicePuzzle(choice) {
        if(choice) {
            if(choice.Var_Value == false) {
                this.correct = false; // choice was incorrect
            }
            this.engine.show("&gt; "+choice.Text);
            this.index += 1;
            this.progressPuzzle();
        } else {
            this.engine.gotoScene(End);
        }
    }
}

class GameWorldItem {
    constructor(engine, key) {} // generic item class, unused
}

class Lamp extends GameWorldItem { // subclass for the lamp item, allows toggling the lamp in any scene
    constructor(engine, key) {
        if(engine.storyData.Variables.Lamp_Lit == false) {
            let data = {Text: "You turn on the lamp", Target: key, Variable: "Lamp_Lit", Var_Value: true};
            engine.addChoice("Turn On Lamp", data);
        }
        else{
            let data = {Text: "You turn off the lamp", Target: key, Variable: "Lamp_Lit", Var_Value: false};
            engine.addChoice("Turn Off Lamp", data);
        }
    }
}

const itemClasses = { // store a dictionary of classes for inventory items
    "Lamp": Lamp
}

Engine.load(Start, 'myStory.json');