
var config = {
    mapX: 15,
    mapY: 5,
    startingMoney: 40,
    colors: {
        player1: "green",
        neutral: "black",
        player2: "darkred"
    },
    defaultUnitTickers: {
        castle: 3,
        farm: 2
    },
    buildingCosts: {
        castle: 35,
        farm: 10,
        market: 20
    },
    captureUnitReward: 5,
    captureBuildingReward: 10,
    knightDamage: 50
};

class Tile{
    constructor(x, y){
        this.x = x;
        this.y = y
        this.bgColor =  config.colors.neutral;
    }
};

class Building{
    constructor(name, x, y, owner = 0){
        this.name = name;

        this.x = x;
        this.y = y;

        this.owner = owner;

        this.resetUnitTicker();

        var isSpaceOccupied = false;
        gameData.buildingList.forEach(function (otherBuilding, index){
            if(otherBuilding.x === x && otherBuilding.y === y){
                isSpaceOccupied = true;
            }
        });

        if(!isSpaceOccupied){
            gameData.buildingList.push(this);
        }
    }

    get imageElem(){
        switch(this.name){
            case "castle":
                return $("<img src='assets/images/castle.png' class='building'>");
            case "farm":
                return $("<img src='assets/images/farm.png' class='building'>");
            case "market":
                return $("<img src='assets/images/market.png' class='building'>");
            case "arrow":
                return $("<img src='assets/images/arrow.png' class='building'>");
            default:
                return undefined;
        }
    }

    tickUnitCreation() {
        if(this.ticksUntilUnit > 0){
            this.ticksUntilUnit -= 1;
        }else if(this.ticksUntilUnit === 0){

            var buildingCoords = [this.x, this.y];
            var isSpaceOccupied = false;

            gameData.unitList.forEach(function (unit){
                if(unit.x === buildingCoords[0] && unit.y === buildingCoords[1]){
                    isSpaceOccupied = true;
                }
            });

            if(!isSpaceOccupied){
                this.resetUnitTicker();

                switch(this.name){
                    case "castle":
                        new Unit("knight", this.x, this.y, this.owner);
                        break;
                    case "farm":
                        new Unit("farmer", this.x, this.y, this.owner);
                        break;
                }
            }
        }
    }

    resetUnitTicker(){
        switch(this.name){
            case "castle":
                this.ticksUntilUnit = config.defaultUnitTickers.castle;
                break;
            case "farm":
                this.ticksUntilUnit = config.defaultUnitTickers.farm;
                break;
            default:
                this.ticksUntilUnit = -1;
                break;
        }
    }

    remove(){
        gameData.buildingList.splice(gameData.buildingList.indexOf(this), 1);

        displayMap();
    }
}

class Unit{
    constructor(name, x, y, owner = 0){
        this.name = name;

        this.x = x;
        this.y = y;

        this.origin = {x: x, y: y};

        this.verticalMoveDir = 1;

        this.owner = owner;

        var isSpaceOccupied = false;
        gameData.unitList.forEach(function (otherUnit){
            if(otherUnit.x === x && otherUnit.y === y){
                isSpaceOccupied = true;
            }
        });

        if(!isSpaceOccupied){
            gameData.unitList.push(this);
        }
    }

    get imageElem(){
        switch(this.name){
            case "farmer":
                return $("<img src='assets/images/farmer.png' class='unit'>");
            case "knight":
                return $("<img src='assets/images/knight.png' class='unit'>");
            default:
                return undefined;
        }
    }

    moveForward(){
        if((this.x < config.mapX - 1 && this.owner === 1) || (this.x > 0 && this.owner === 2)){
            var newY = this.y;
            var newX = this.x + 1 * (this.owner === 1 ? 1 : this.owner === 2 ? -1 : console.error("Unit asked to move but does not have an owner"));
            var thisUnit = this;
            var conflictFound = false;
            var conflictUnit = undefined;
            var hasBackup = false;
            gameData.unitList.forEach(function (otherUnit){
                if(otherUnit.x === newX && otherUnit.y === newY){
                    conflictFound = true;
                    conflictUnit = otherUnit;
                }
                if(otherUnit.owner === thisUnit.owner && otherUnit.x === thisUnit.x - 1 * (thisUnit.owner > 0 ? 1 : -1)){
                    hasBackup = true;
                }
            });
            if(!conflictFound){
                this.x = newX;
                displayMap();
            }else if((this.name === "knight" && conflictUnit.name !== "knight") || hasBackup){
                conflictUnit.remove();
                if(gameData.isPlayerOne){
                    gameData.p1Money += config.captureUnitReward;
                }else{
                    gameData.p2Money += config.captureUnitReward;
                }
                this.x = newX;
                displayMap();
            }

            gameData.buildingList.forEach(function (building){
                if(building.x === thisUnit.x && building.y === thisUnit.y && thisUnit.owner !== building.owner){
                    building.remove()
                    if(gameData.isPlayerOne){
                        gameData.p1Money += config.captureBuildingReward;
                    }else{
                        gameData.p2Money += config.captureBuildingReward;
                    }

                    thisUnit.remove();
                }
            });
            
        }else{
            if((gameData.p1Money < config.knightDamage && this.owner === 2) || (gameData.p2Money < config.knightDamage && this.owner === 1)){
                this.remove();
                alert(this.owner === 1 ? "Player One Wins!" : this.owner === 2 ? "Player Two Wins!" : "GENERAL CONFUSION ARISES");
            }else if(this.owner === 1){
                this.remove();
                gameData.p2Money -= config.knightDamage;
            }else if(this.owner === 2){
                this.remove();
                gameData.p1Money -= config.knightDamage;
            }
        }
    }

    moveVertical(){
        if(this.y === 0){
            this.verticalMoveDir = 1;
        }else if(this.y === config.mapY - 1){
            this.verticalMoveDir = -1;
        }

        var newX = this.x;
        var newY = this.y + this.verticalMoveDir;
        var conflictFound = false;

        gameData.unitList.forEach(function (otherUnit) {
            if(otherUnit.x === newX && otherUnit.y === newY){
                conflictFound = true;
            }
        });

        if(!conflictFound){
            this.x = newX;
            this.y = newY;
        }else{
            this.verticalMoveDir = this.verticalMoveDir > 0 ? -1 : 1;
        }
    }

    remove(){
        gameData.unitList.splice(gameData.unitList.indexOf(this), 1);

        displayMap();
    }
}

var gameData = {
    map: function(){
        tempMap = Array.from(Array(config.mapX), () => new Array(config.mapY));
        for(var x = 0; x < config.mapX; x++){
            for(var y = 0; y < config.mapY; y++){
                tempMap[x][y] = new Tile(x, y);
            }
        }

        return tempMap;
    }(),
    get playerPlaceLim(){
        var p1FarBuilding = -1;
        var p2FarBuilding = config.mapX;
        
        gameData.buildingList.forEach(function (building){
            if(building.owner === 1 && building.x > p1FarBuilding){
                p1FarBuilding = building.x;
            }else if(building.owner === 2 && building.x < p2FarBuilding){
                p2FarBuilding = building.x;
            }
        });

        if(Math.abs(p1FarBuilding - p2FarBuilding) === 2){
            return [p1FarBuilding, p2FarBuilding];
        }else if(Math.abs(p1FarBuilding - p2FarBuilding) === 3){
            return [p1FarBuilding + 1, p2FarBuilding - 1];
        }

        return [p1FarBuilding + 2, p2FarBuilding - 2];
    },
    tick: function(){  
        gameData.unitList.forEach(function (unit){
            if(unit.name === "knight"){
                unit.moveForward();
            }else if(unit.name === "farmer"){
                unit.moveVertical();
                gameData.buildingList.forEach(building => {
                    if(building.name === "market" && building.x === unit.x && building.y === unit.y){
                        var diff = Math.abs(unit.origin.y - unit.y);

                        if(unit.owner === 1){
                            gameData.p1Money += 10 + Math.floor(diff / 2) * 5;
                        }else if(unit.owner === 2){
                            gameData.p2Money += 10 + Math.floor(diff / 2) * 5;
                        }

                        unit.remove();
                    }
                });
                
            }
        });

        gameData.buildingList.forEach(function (building) {
            building.tickUnitCreation();
        });

        displayMap();
    },
    selection: {name: "farm", type: "building"},
    isPlayerOne: true,
    p1Money: config.startingMoney,
    p2Money: config.startingMoney,
    unitList: [],
    buildingList: []
}

function displayTile(tile){
    htmlTile = $("<td>");

    if(tile.bgColor){
        htmlTile.css("background-color", tile.bgColor)
    }

    htmlTile.data("x", tile.x);
    htmlTile.data("y", tile.y);

    gameData.buildingList.forEach(function (building){
        if(building.x === tile.x && building.y === tile.y){
            htmlTile.append(building.imageElem);
        }
    });

    gameData.unitList.forEach(function (unit){
        if(unit.x === tile.x && unit.y === tile.y){
            htmlTile.append(unit.imageElem);
        }
    });

    htmlTile.on("click", function(event){
        applySelection(gameData.selection, $(event.delegateTarget).data("x"), $(event.delegateTarget).data("y"));

        displayMap();
    });

    return htmlTile;
}

function applySelection(selection, x, y){
    if((x > gameData.playerPlaceLim[0] && gameData.isPlayerOne) || (x < gameData.playerPlaceLim[1] && !gameData.isPlayerOne)){
        return;
    }else if(selection.type === "building"){
        if(gameData.isPlayerOne && gameData.p1Money >= config.buildingCosts[selection.name]){
            gameData.p1Money -= config.buildingCosts[selection.name];
            new Building(selection.name, x, y, gameData.isPlayerOne ? 1 : 2);
        }else if(!gameData.isPlayerOne && gameData.p2Money >= config.buildingCosts[selection.name]){
            gameData.p2Money -= config.buildingCosts[selection.name];
            new Building(selection.name, x, y, gameData.isPlayerOne ? 1 : 2);
        }
        
    }else if(selection.type === "unit"){
        new Unit(selection.name, x, y, gameData.isPlayerOne ? 1 : 2);
    }
}

function displayMap(){
    var gameMap = $("<table>").attr("id", "gameMap");

    for(var y = config.mapY - 1; y >= 0; y--){
        gameMap.append("<tr>");
        for(var x = 0; x < config.mapX; x++){

            //sets the background for tiles the player can place buildings on
            if(x <= gameData.playerPlaceLim[0] && !(x > gameData.playerPlaceLim[1])){
                gameData.map[x][y].bgColor = config.colors.player1;
            }else if(!(x < gameData.playerPlaceLim[0]) && x >= gameData.playerPlaceLim[1]){
                gameData.map[x][y].bgColor = config.colors.player2;
            }else{
                gameData.map[x][y].bgColor = config.colors.neutral;
            }
            
            gameMap.append(displayTile(gameData.map[x][y]));
        }
    }

    $("#gameContainer").html(gameMap);

    $("#moneyCount").text(`You (${gameData.isPlayerOne ? "player one" : "player two"}) have $${gameData.isPlayerOne ? gameData.p1Money : gameData.p2Money} in coins!`)
}

$("document").ready(function () {

    $("#farmButton").append(` ($${config.buildingCosts.farm})`);
    $("#marketButton").append(` ($${config.buildingCosts.market})`);
    $("#castleButton").append(` ($${config.buildingCosts.castle})`);

    $("#farmButton").on("click", function(event){
        gameData.selection = {name: "farm", type: "building"};
    });

    $("#marketButton").on("click", function(event){
        gameData.selection = {name: "market", type: "building"};
    });

    $("#castleButton").on("click", function(event){
        gameData.selection = {name: "castle", type: "building"};
    });

    $("#farmerButton").on("click", function(event){
        gameData.selection = {name: "farmer", type: "unit"};
    });

    $("#knightButton").on("click", function(event){
        gameData.selection = {name: "knight", type: "unit"};
    });

    $("#endTurn").on("click", function(event){
        if(!gameData.isPlayerOne){
            gameData.tick();
        }

        gameData.isPlayerOne = !gameData.isPlayerOne;

        displayMap();
    });

    displayMap();
});