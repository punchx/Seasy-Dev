var Seasy = function(selector, context) {
	return new Seasy.prototype.sInit( selector, context );
}

var pRoot = app.project,
		qRExpr = /^(?:#(\d+)|(\^?\*?[^#@:>\{\}]+))$/,
		regExpr = {
			id: /^(#\d+)(.*)/,
			name: /^(\^)?(\*)?([^:#@$>\{\}]+)(.*)/,
			type: /:\s*(\w+)(.*)/,
			elementType: /(composition|comp|folder|footage|text|solid|light|camera|nullLayer|shape|adjustment|video|audio)/,
			fileType: /(psd|ai|mov|png|jpg|exr|c4d|mp3|wav|tga|mpeg|mpg|mp4|eps|obj|pdf|avi|bmp|tif|raw|dpx|img|flv|ma|m2t|sxr|mxr|3gp|hdr|rla|rpf|wmv|wma)/,
			attr: /\{\s*(\^*)\s*(\w+)\s*=*\s*(\w*)\s*\}/
		};

Seasy.fn = Seasy.prototype = {

	seasy: '0.01',
	constructor: Seasy,
	length: 0,
	selector: '',

	push: [].push,

	merge:  function (obj) {	
		var len = this.length,
				lenObj = obj.length;
				i = 0;

		if(lenObj in obj) {
			i++;
			lenObj++;
		} 

    for(; i < lenObj; i++) {
      this[len++] = obj[i];
    }

    this.length = len;
    return this;
  },

  copy: function(obj) {
  	var len = obj.length,
  			oldLen = this.length;
  			i = 0,
  			j = 0;

  	if(len in obj) {
  		i++;
  		len++;
  	}

  	for(; i < len; i++) {
      this[j++] = obj[i];
    }

    this.length = j;

    for(var k = this.length; k < oldLen; k++ ) {
    	delete this[k];
    }

    return this;
  },

  filter: function(selector) {
  	var tempArr = [],
  			match,
  			method,
  			sel=[];

		var filter = {
				'id': function(obj, sel) {
								if (isLayer(obj)) {
									return obj.index == parseFloat(sel[0]) ? true : false;
								}
								if (isItem(obj)) {
									return obj == pRoot.item(parseFloat(sel[0])) ? true : false;
								}
							},
				'name': function(obj, sel) {
									var fixed = !((sel[1]=='*') || (sel[2] == '*') || false),
										not = (sel[1]=='^') || (sel[2] == '^') || false,
										boole = false;

									if (!fixed) {
										boole = (obj.name.indexOf(sel[0]) >= 0) || false;
									} else {
										boole = obj.name == sel[0]; 
									}
									return not ? !boole : boole;
								},

				'type': function(obj, sel) {
									var elementType = {
												composition: isComp,
												comp: isComp,
												folder: isFolder,
												footage: isFootage,
												text: isText,
												solid: isSolid,
												light: isLight,
												camera: isCamera,
												nullLayer: isNullLayer,
												shape: isShape,
												adjustment: isAdjustment,
												video: isVideo,
												audio: isAudio
											},
											matchType;

									if (matchType = sel[0].match(regExpr['elementType'])) {
										return elementType[matchType[1]](obj);
									}

									if (matchType = sel[0].match(regExpr['fileType'])) {
										return getFileExtension(obj) === matchType[1];
									}
							
									return false;
								},
				'attr': function(obj, sel) {
									var value;
									if(sel[2] !== '') {
										value = obj[sel[1]] == sel[2];
									} else {
										value = obj[sel[1]] == true;
									}
									return (sel[0] == '^') ? !value : value;
								}
		};
  	
  	if (match = selector.trim().match(regExpr['id'])) {
  		// console.log('id');
  		if (match[2]==='') {
  			method = 'id';
  			sel[0] = match[1].slice(1);
  		} else {  			
  			return this.filter(match[1]).filter(match[2]);
  		}
  	}

  	if (match = selector.trim().match(regExpr['name'])) {
  		// console.log(selector);
  		if (match[4]==='') {
  			method = 'name';
  			sel[0] = match[3];
  			sel[1] = match[1];
  			sel[2] = match[2];
  		} else {
  			return this.filter((match[1] || '') + (match[2] || '') + match[3]).filter(match[4]);
  		}
  	}

  	if (match = selector.trim().match(regExpr['type'])) {
  		if (match[2]==='') {
  			method = 'type';
  			sel[0] = match[1];
  		} else { 
  			return this.filter(':' + match[1]).filter(match[2]);
  		}
  	}

  	if (match = selector.trim().match(regExpr['attr'])) {
  		// console.log('attr');
  		if (match[2] !== '') {
  			method = 'attr';
  			sel[0] = match[1];
  			sel[1] = match[2]
  			sel[2] = match[3]
  		}
  	}

		for(var i = 0; i < this.length; i++) {
		
			if (filter[method](this[i], sel)) {
				tempArr.push(this[i]);
			}  		
		}
  	return this.copy(tempArr);
  },

}

var sInit = Seasy.prototype.sInit = function(selector, context) {
	var key,
			index,
			elem,
			indexArr,
			indexParent,
			indexChild;


	// Make select key for diffrent contexts

	if (!context || context === pRoot || isFolder(context) ||
	(isRQ(context) || (context == 'RQ' && context = pRoot.renderQueue))) {
		context = context || pRoot;
		key = 'item';
	} else if (isComp(context)) {
		key = 'layer';
	} else if (isRQItem(context)) {
		key = 'outputModule';
	}

	if (!selector && selector != 0) {
			return this;
		}

	if ((typeof selector === 'number') || (selector === 0)) {
			index = selector;

			if ( index === 0 ) {

				if ( key == 'item' ) {
					this.length = 1;
					this[0] = context.activeItem || app.project.selection[0];
					this.selector = selector;
					this.context = context;
					return this;
				}

				if ( key = 'layer' ) {
					this.length = 1;
					this[0] = context.selectedLayers[0];
					this.selector = selector;
					this.context = context;
					return this;
				}
			}

			//First case when number is an integer number 

			if (isInt(index)) {

				if (key) {
					elem = (index > 0) ? context[key](index) :
									context[key](context['num' + key[0].toUpperCase() + key.slice(1) + 's'] + index + 1);
					this.length = 1;
					this[0] = elem;
					this.selector = selector;
					this.context = context;
					return this;
				}	
			}	else if (isFloat(index)) {

			//Second case when selector is a float number

				indexArr = index.toString().split('.');
				indexParent = parseFloat( indexArr[0] );
				indexChild = parseFloat( indexArr[1] );
				this[0] = Seasy(indexChild, Seasy(indexParent)[0])[0];
				this.selector = selector;
				this.context = context;
				return this;				
			}			
		}

		// Handle case when selector is an array of indexes

		if (isArr(selector)) {
			for (var i = 0; i < selector.length; i++) {
				this.push(Seasy(selector[i], context)[0]);
			}
			this.selector = selector;
			this.context = context;
			return this;
		}

		//Handle case when selector is a string

		if (typeof selector === 'string') {
			selector = selector.trim();
			
			//Selct all objects

			if (selector == '*') {
				this.merge(context[key + 's']);
				this.selector = selector;
				this.context = context;
				return this;
			}
		}

		//Selct active elements

		if (selector == '@') {
			if (key =='item') {
				this.merge(Seasy(0, context));
			} else if (key == 'layer') {
				this.merge(Seasy('*', context).filter('[active]')); //no realization
			}
			this.selector = selector;
			this.context = context;
			return this;
		}

		//Select selected elements

		if (selector == '$') {
			if (key =='layer') {
				this.merge(context.selectedLayers);
			} else if ( key == 'item') {
					if (context == pRoot) {					
						this.merge(context.selection);
					}
					if (isFolder(context)) {
						this.merge(Seasy(*, context).filter('[selected]'));//no realization
					}
			}
			this.selector = selector;
			this.context = context;
			return this;
		}

		//Match selector by #id or name

		if ( match = selector.match( qRExpr ) ) {
		 if ( match[1] ) {
					return Seasy( parseFloat( match[1] ), context );
				} else ( match[2] ) {
					this.merge(Seasy('*', context).filter(match[2]));								
					this.selector = selector;
					this.context = context;
					return this;
				}
			}
}

sInit.prototype = Seasy.prototype;
//Seasy functions

// GLobal functions 

String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/gm, '');
}

function isInt(value) {
	return (typeof value === 'number' && (value % 1) === 0) ? true : false;
}

function isFloat(value) {
	return (typeof value === 'number' && (value % 1) !== 0) ? true : false;
}

function isArr(value) {
	return Object.prototype.toString.call(value) === '[object Array]';
}

function isItem(value) {
	return value.typeName ? true : false;
}

function isFolder(value) { 
	return value instanceof FolderItem ;
}

function isComp(value) {
	return (value.source || value) instanceof CompItem;
}

function isFootage(value) {
	return (value.source || value) instanceof FootageItem;
}

function isLayer(value) {
	return value.containingComp ? true : false;
}

function isText(value) {
	return value instanceof TextLayer;
}

function isShape(value) {
	return value instanceof ShapeLayer;
}

function isCamera(value) {
	return value instanceof CameraLayer;
}

function isLight(value) {
	return value instanceof LightLayer;
}

function isSolid(value) {
	return ((value.source && value.source.mainSource) || value.mainSource) instanceof SolidSource;
}

function isNullLayer(value) {
	return value.nullLayer || false;
}

function isAdjustment(value) {
	return value.adjustmentLayer || false;
}

function isVideo(value) {
	value = value.source || value;
	return (isFootage(value) && value.frameRate) ? true : false;
}

function isAudio(value) {
	return value.hasAudio && !isVideo(value);
}

function isOpenInViewer(value) {
	return true;
}

function isRQ() {return false};
function isRQItem() { return false };
function isElem(value) { return true };

function getFileExtension(value) {
	var valueTmp = value.source || value;
	return valueTmp.file ? valueTmp.file.name.split('.')[1] : undefined;
}




console.log(Seasy('*').filter('*Comp{label=1}').length);





