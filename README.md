# online-fsm
Online Finite State Machine designer and simulator

- **TECH STACK:** ASP.NET Core, JavaScript, CSS/HTML, Webpack, MongoDB, Docker
- **TRY IT OUT:** [fsm-simulator.info](http://fsm-simulator.info/)

## Features

### FSM designer
Create your Finite State Machine with an interactive designer

<img src="/002.png" height="310" width="640" >

1. Top menu
   - New — clear workspace and create a new FSM
   - Save — store your FSM for later use
     - as a plain image
     - as a local JSON file
     - in the database and generate a unique URL for it
   - Load — load your FSM from a JSON file
   - Run — start the simulation of your FSM
2. Home button 
3. Designer workspace that you can interact with using your mouse or touchscreen and keyboard to build your FSM
   - arrange all the states and tranistions the way you want
   - use special shortcuts for all the actions from the bottom menu to build your FSM faster
4. Bottom menu
   - Add — add a new FSM state
   - Connect — add a new FSM transition
   - Accept — make the selected FSM state accepting
   - Initial — make the selected FSM state accepting
   - Edit — change the name of the selected FSM state or conditions for the selected FSM transition
   - Delete — remove the selected state or transition

### FSM simulator
Run a step-by-step simulation of the Finite State Machine you designed

<img src="/003.png" height="310" width="640" >

1. Top menu
   - New — clear workspace and create a new FSM
   - Save — store your FSM for later use
     - as a plain image
     - as a local JSON file
     - in the database and generate a unique URL for it
   - Load — load your FSM from a JSON file
   - Edit — open the designer to edit your FSM
2. Text message describing the current state of the simulation
3. Home button
4. Visualization of the current state of your FSM. Currently active states are marked with a blue color
5. Input string for the ongoing simulation. Already processed symbols are marked with a gray color. Blue color denotes the next input symbol
6. Bottom menu
   - Reset — start again the simulation
   - Prev — take a step back in the simulation
   - Set input — make the selected FSM state accepting
   - Next — process the next input symbol
   - Read all — go to the end of the simulation
