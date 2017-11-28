/**
 * Statemachine class with emphasis on quick initialisation, lightweight
 * state storage, and easy state visualisation.
 *
 */
class StateMachine {

  /**
   * Create a statemachine instance
   *
   * @param  {Object}    states  State machine definition
   * @link ../dialog/ABOUT.md
   * @param  {Object}    env=none     The environment available to any exec functions
   * @param  {String}    initial=from-definition Name of initial state
   */
  constructor(states, env, initial) {
    this.states = states.states;
    this.name = states.name;
    this.init = states.init;
    this.env = env;
    this.state = (initial) ? initial : this.init;
  }

  /**
   * Get a transition from current state to new state based on Action (if valid)
   *
   * @param  {String}        action Name of action
   * @return {Object}        Transition object (null if not a valid action in this state)
   */
  validTransition(action) {
    console.log('Action: ', action, 'transitions available: ', this.states[this.state].transitions)
    return this.states[this.state].transitions[action];
  }
  /**
   * Apply an action to cause a transition
   *
   * @param  {String}  name Action name
   * @return {String}         The 'emit' string for this action (or return from exec
   * function if this exists)
   */
  action(name) {
    const transition = this.validTransition(name)
    if(transition != null) {
      var emit = (transition.emit != null) ? transition.emit : '';
      this.state = transition.to;
      if(transition.exec != null)
        emit = transition.exec(emit);
      return(emit);
    } else {
      return null;
    }
  }

  /**
   * Get a GraphViz compatible digraph description of this
   * state machine.
   *
   * @return {String} Text of GraphViz Description
   * @example foo = new StateMachine(snowmanDefinition)
   * console.log(foo.describe());
   *
   *
   * Outputs:
   * digraph "Snowman State Transitions" {
   *    "snow" [color=red];
   *    "snowman";
   *    "water";
   *    "clouds";
   *    "snow" -> "snowman" [ label="Action: build\nSay: lets build a snowman"]
   *    "snow" -> "water" [ label="Action: melt\nSay: oh no, it melted too quickly"]
   *    "snowman" -> "water" [ label="Action: melt\nSay: help, I'm melting"]
   *    "water" -> "clouds" [ label="Action: evaporate\nSay: it's very warm today"]
   *    "clouds" -> "snow" [ label="Action: snowing\nSay: hey it's snowing"]
   * }
   *
   */
  describe() {
    var ret = `digraph "${this.name}" {\n`;
    var transitions = ""

    for(let name of Object.keys(this.states)) {
      const state = this.states[name];
      console.log('name: ', name, 'states: ', 'state: ', this.states, state);
      ret += `  "${name}"${(name==this.init)?' [color=red]':''};\n`
      for(let action of Object.keys(state.transitions)) {
        transitions += `  "${name}" -> "${state.transitions[action].to}" [ label="Action: ${action}`
        if(state.transitions[action].emit != null)
          transitions += `\\nSay: ${state.transitions[action].emit}`
        transitions += `"]\n`;
      }
    }
    ret += transitions + '\n}\n';
    return ret;

  }
}

module.exports = exports = {
  StateMachine
};
