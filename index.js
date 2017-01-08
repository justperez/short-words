var doc = require('global/document');
var win = require('global/window');
var createElement = require('virtual-dom/create-element');
var diff = require('virtual-dom/diff');
var patch = require('virtual-dom/patch');
var h = require('virtual-dom/h');
var unified = require('unified');
var english = require('retext-english');
var syllable = require('syllable');
var toString = require('nlcst-to-string');
var debounce = require('debounce');

var processor = unified().use(english);
var hue = hues();
var root = doc.getElementById('root');
var tree = render(doc.getElementsByTagName('template')[0].innerHTML);
var dom = root.appendChild(createElement(tree));

function onchange(ev) {
  var next = render(ev.target.value);
  dom = patch(dom, diff(tree, next));
  tree = next;
}

function resize() {
  dom.lastChild.rows = rows(dom.firstChild);
}

function render(text) {
  var tree = processor.run(processor.parse(text));
  var change = debounce(onchange, 4);
  var key = 0;

  setTimeout(resize, 4);

  return h('div', {key: 'editor', className: 'editor'}, [
    h('div', {key: 'draw', className: 'draw'}, pad(all(tree, []))),
    h('textarea', {
      key: 'area',
      value: text,
      oninput: change,
      onpaste: change,
      onkeyup: change,
      onmouseup: change
    })
  ]);

  function all(node, parentIds) {
    var children = node.children;
    var length = children.length;
    var index = -1;
    var results = [];

    while (++index < length) {
      results = results.concat(one(children[index], parentIds.concat(index)));
    }

    return results;
  }

  function one(node, parentIds) {
    var result = 'value' in node ? node.value : all(node, parentIds);
    var styles = style(node);
    var id = parentIds.join('-') + '-' + key;

    if (styles) {
      result = h('span', {key: id, id: id, style: styles}, result);
      key++;
    }

    return result;
  }

  /* Trailing white-space in a `textarea` is shown, but not in a `div`
   * with `white-space: pre-wrap`. Add a `br` to make the last newline
   * explicit. */
  function pad(nodes) {
    var tail = nodes[nodes.length - 1];

    if (typeof tail === 'string' && tail.charAt(tail.length - 1) === '\n') {
      nodes.push(h('br', {key: 'break'}));
    }

    return nodes;
  }
}

function style(node) {
  var result = {};

  if (node.type === 'WordNode') {
    result.backgroundColor = color(syllable(toString(node)));
    return result;
  }
}

function color(count) {
  var val = count < hue.length ? hue[count] : hue[hue.length - 1];
  return 'hsl(' + [val, '93%', '85%'].join(', ') + ')';
}

function hues() {
  var colors = [];
  colors[1] = 75;
  colors[2] = 60;
  colors[3] = 45;
  colors[4] = 30;
  colors[5] = 15;
  colors.push(0);
  return colors;
}

function rows(node) {
  if (!node) {
    return;
  }

  return Math.ceil(
    node.getBoundingClientRect().height /
    parseInt(win.getComputedStyle(node).lineHeight, 10)
  );
}
