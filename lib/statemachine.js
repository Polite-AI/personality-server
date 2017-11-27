/**
 * Room and message processor. Handles the mechanics of classifying and responding
 * to messages.
 *
 */
class StateMachine {

  constructor(states, env, initial) {
    this.states = states.states;
    this.name = states.name;
    this.init = states.init;
    this.env = env;
    this.state = (initial) ? initial : this.init;
  }

  validTransition(transition) {
    return this.states[this.state].transitions[transition];
  }

  doTransition(name) {
    const transition = this.validTransition(name)
    if(transition != null) {
      transition.process(this.state, transition.to)
      this.state = transition.to;
      transition.run(transition.emit)
      return((transition.emit!=null)?transition.emit:'');
    } else {
      return null;
    }
  }

  describe() {
    var ret = `digraph "${this.name}" {\n`;
    var transitions = ""

    for(let name of Object.keys(this.states)) {
      const state = this.states[name];
      console.log('name: ', name, 'states: ', 'state: ', this.states, state);
      ret += `  "${name}"${(name==this.init)?' [color=red]':''};\n`
      for(let action of Object.keys(state.transitions))
        transitions += `  "${name}" -> "${state.transitions[action].to}" [ label="Action: ${action}\\nSay: ${state.transitions[action].emit}"]\n`;
    }

    ret += transitions + '\n}\n';
    return ret;

  }
}

module.exports = exports = {
  StateMachine
};
