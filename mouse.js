var testserino = 4
module.exports = function(speed, value, code) {
    var robot = require("robotjs")

    robot.setMouseDelay(speed)

    function moveCursor(code) {
        robot.setMouseDelay(speed)
        var mouse = robot.getMousePos()
        var availableCodes = {
          "leftArr": [
            "20",
            "28",
            "30"
          ],
          "rightArr": [
            "05",
            "06",
            "81",
            "8b",
            "84",
            "8c",
            "82",
            "8a",
            "83",
            "89"
          ]
        }
        testserino++
        console.log(testserino)
        if(availableCodes.leftArr.indexOf(code[0]) !== -1 || availableCodes.rightArr.indexOf(code[1]) !== -1) {
          console.log("MOUSE!!!!")
          code = code.join('')
          console.log(code)
          switch (code) {
            case "2081":
            robot.moveMouse(mouse.x, mouse.y - value);
            break
            case "208b":
            robot.moveMouse(mouse.x + value, mouse.y - value);
            break
            case "2084":
            robot.moveMouse(mouse.x + value, mouse.y);
            break
            case "208c":
            robot.moveMouse(mouse.x + value, mouse.y + value);
            break
            case "2082":
            robot.moveMouse(mouse.x, mouse.y + value);
            break
            case "208a":
            robot.moveMouse(mouse.x - value, mouse.y + value);
            break
            case "2083":
            robot.moveMouse(mouse.x - value, mouse.y);
            break
            case "2089":
            robot.moveMouse(mouse.x - value, mouse.y - value);
            break

            case "28":
            robot.mouseToggle("down", "left");
            break
            case "20":
            robot.mouseToggle("up", "left");
            break
          }
        }
        //console.log("MOUSE MOVED!!!")
    }
    moveCursor(code)
}
