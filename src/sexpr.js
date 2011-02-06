var SExpr={}

SExpr.inspect=function(expr) {
	if(expr===null)
		return '()';
	if(expr===undefined)
		return '<undefined>';
	if(expr.isSymbol)
		return expr.name;
	if(expr.isCons) {
		var result=[];
		for(var c=expr; ; c=c.cdr) {
			result.push(SExpr.inspect(c.car));
			if(c.cdr===null) {
				break;
			} else if(!c.cdr.isCons) {
				result.push('.');
				result.push(SExpr.inspect(c.cdr));
				break;
			}
		}
		return '('+result.join(' ')+')';
	}
	var t=typeof(expr);
	switch(t) {
		case 'string':
			return '"'+expr.replace('"','\\"')+'"';
		default:
			return ''+expr;
	}
}
SExpr.isCons=function(expr) {
	return expr && expr.isCons;
}

SExpr.isSymbol=function(expr) {
	return expr && expr.isSymbol;
}

SExpr.Cons=function(car,cdr) {
	this.car=car;
	this.cdr=cdr;
	this.isCons=true;
}
SExpr.Cons.makeList=function() {
	return SExpr.Cons.makeUnproperList(arguments,null);
}
SExpr.Cons.makeUnproperList=function(heads,last) {
	var result=last;
	for(var i=heads.length-1; i>=0; i--)
		result=new SExpr.Cons(heads[i],result);
	return result;
}

SExpr.Symbol=function(name) {
	return {
		isSymbol: true,
		name: name
	}
}


function SParser() {
}

SParser.prototype={
	parse: function(src) {
		var r=new SParser.Reader(src);
		var result=[];
		r.skipWS();
		while(!r.isEOF()) {
			result.push(this._parse(r));
			r.skipWS();
		}
		return result;
	},
	parseSingle: function(src) {
		var exprs=this.parse(src);
		if(exprs.length!=1)
			throw new 'SParser#parseSingle: expression count != 1';
		return exprs[0];
	},
	_parse: function(r) {
		var c=r.peek();
		if(c=='(') {
			return this._parseList(r);
		} else if(this._isNumeric(c)) {
			return this._parseNumeric(r);
		} else if(c=='"') {
			return this._parseString(r);
		} else if(this._isSymbol(c)) {
			return this._parseSymbol(r);
		} else {
			throw 'SParser: illegal SExpr syntax';
		}
	},
	_isNumeric: function(c){ return /^\d$/.test(c); },
	_isSymbol: function(c){ return /^[-+*\/\\=!?$#@%^&|<>:_\[\].a-zA-Z0-9]$/.test(c); },
	_parseNumeric: function(r) {
		var str='';
		while(!r.isEOF() && this._isNumeric(r.peek())) {
			str+=r.next();
		}
		return parseInt(str);
	},
	_parseString: function(r) {
		r.next();
		var str='';
		var escaped=false;
		while(!r.isEOF() && (escaped || r.peek()!='"')) {
			if(!escaped && r.peek()=='\\') {
				r.next();
				escaped=true;
			} else {
				escaped=false;
				str+=r.next();
			}
		}
		if(!escaped && r.peek()=='"') {
			r.next();
		} else {
			throw "SParser: non-closed string literal";
		}
		return str;
	},
	_parseSymbol: function(r) {
		var name='';
		while(!r.isEOF() && this._isSymbol(r.peek())) {
			name+=r.next();
		}
		return new SExpr.Symbol(name);
	},
	_parseList: function(r) {
		r.next();
		var list=[];
		var last=null;
		while(!r.isEOF() && r.peek()!=')') {
			list.push(this._parse(r));
			r.skipWS();
			if(!r.isEOF() && r.peek()=='.') {
				r.next();
				if(r.peek()!=' ')
					throw 'SParser: broken list literal';
				r.skipWS();
				last=this._parse(r);
				r.skipWS();
				break;
			}
		}
		if(r.peek()==')') {
			r.next();
		} else {
			throw 'SParser: non-closed list literal';
		}
		return SExpr.Cons.makeUnproperList(list,last);
	}
}

SParser.Reader=function(src) {
	this.src=src;
	this.index=0;
}

SParser.Reader.prototype={
	isEOF: function () {
		return this.index >= this.src.length;
	},
	peek: function() {
		return this.src[this.index];
	},
	next: function() {
		return this.src[this.index++];
	},
	skipWS: function() {
		while(!this.isEOF() && /^\s$/.test(this.peek()))
			this.next();
	}
}
