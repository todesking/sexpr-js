(function() {
var eq=QUnit.equiv;

module('SParser.Reader',{
	setup:function(){
		this.R=SParser.Reader;
	}
});

test('#peek and #next and #isEOF',function(){
	ok(new this.R('').isEOF());

	var r=new this.R('hoge');
	ok(!r.isEOF());

	eq(r.peek(),'h');
	eq(r.peek(),'h');

	eq(r.next(),'h');

	eq(r.peek(),'o');
	eq(r.next(),'o');

	eq(r.next(),'g');
	eq(r.next(),'e');

	ok(r.isEOF());
});

test('#skipWS',function(){
	var r=new this.R(' 1  2  \n      ');
	eq(r.peek(),' ');
	r.skipWS();
	eq(r.peek(),'1');
	r.next();
	r.skipWS();
	eq(r.peek(),'2');
	r.skipWS();
	eq(r.peek(),'2');
	r.next();
	ok(!r.isEOF());
	r.skipWS();
	ok(r.isEOF());
});


module('SParser',{
	setup: function(){
		this.S=new SParser();
	}
});

test('assume setup works',function(){
	ok(this.S);
});

test('return [] when parse empty string',function(){
	eq(this.S.parse(''),[]);
});

test('literal: integer',function(){
	eq(this.S.parse('10'),[10]);
});

test('literal: string',function(){
	eq(this.S.parse('"hoge"'),['hoge']);
	eq(this.S.parse('"quote\\""'),['quote"']);
	eq(this.S.parse('"\\\\"'),['\\']);
});

test('literal: symbol',function() {
	eq(this.S.parse('a'),[new SExpr.Symbol('a')]);
	eq(this.S.parse('=='),[new SExpr.Symbol('==')]);
	eq(this.S.parse('$1'),[new SExpr.Symbol('$1')]);
	eq(this.S.parse('\\'),[new SExpr.Symbol('\\')]);
});

test('multiple spaces',function(){
	eq(this.S.parse('              1                    '),[1]);
});

test('list: nil',function(){
	eq(this.S.parse('()'),[null]);
});

test('list: normal',function(){
	eq(this.S.parse('(1 2 3)'),[SExpr.Cons.makeList(1,2,3)]);
});

test('list: not proper',function(){
	eq(this.S.parse('(1 . 2)'),[new SExpr.Cons(1,2)]);
	eq(this.S.parse('(0 1 . 2)'),[new SExpr.Cons(0, new SExpr.Cons(1,2))]);
});

test('multiple expressions',function() {
	var s1='(1 2 3)';
	var s2='a';
	var s3='(eq? "hoge" "fuga")';
	eq(this.S.parse([s1,s2,s3].join('\n')),[
		this.S.parseSingle(s1),
		this.S.parseSingle(s2),
		this.S.parseSingle(s3)
	]);
});


module('SExpr.Cons')

test('.makeList',function(){
	var C=SExpr.Cons;
	eq(C.makeList(),null);
	eq(C.makeList(1),new C(1,null));
	eq(C.makeList(1,2),new C(1,new C(2,null)));
});

module('SExpr');

test('.inspect(expr)',function() {
	var p=new SParser();
	var isp=function(src) {
		return SExpr.inspect(p.parseSingle(src));
	};
	eq(isp('1'),'1');
	eq(isp('"hoge"'),'"hoge"');
	eq(isp('"ho\\"ge"'),'"ho\\"ge"');
	eq(isp('()'),'()');
	eq(SExpr.inspect(undefined),'<undefined>');
	eq(isp('hoge'),'hoge');
	eq(isp('(1 . 2)'),'(1 . 2)');
	eq(isp('(1 2 3)'),'(1 2 3)');
	eq(isp('(1 2 3 . 4)'),'(1 2 3 . 4)');
	eq(isp('(1 (2 . 3) . 4)'),'(1 (2 . 3) . 4)');
	eq(isp('(1)'),'(1)');
});

test('.isCons(expr)',function() {
	var p=new SParser();
	function cons(str) {
		var expr=p.parseSingle(str);
		ok(SExpr.isCons(expr),SExpr.inspect(expr)+' is cons');
	}
	function notCons(str) {
		var expr=p.parseSingle(str);
		ok(!SExpr.isCons(expr),SExpr.inspect(expr)+' is not cons');
	}
	cons('(a . b)');
	cons('(1 2 3)');
	notCons('()');
	notCons('1');
});

test('.isSymbol(expr)',function() {
	var p=new SParser();
	function sym(str){
		var e=p.parseSingle(str);
		ok(SExpr.isSymbol(e),SExpr.inspect(e)+' is symbol');
	}
	function notSym(str){
		var e=p.parseSingle(str);
		ok(!SExpr.isSymbol(e),SExpr.inspect(e)+' is not symbol');
	}

	sym('a');
	sym('_$hoge');
	notSym('1');
	notSym('()');
	notSym('(a b)');
});
})();
