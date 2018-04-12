/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex

%%
\s+                   /* skip whitespace */

"//"[^\/]*   return  'comment'

/* Values */
"True"                return 'true'
"False"               return 'false'
"NIL"                 return 'nil'
"NULL"                return 'null'

/* Data types */
"const"               return 'constant'
"String"              return 'type'
"Char"                return 'type'
"Integer"             return 'type'
"Real"                return 'type'
"Enum"                return 'type'
"Pointer"             return 'type'
"Array"               return 'array'
"Register"            return 'register'
"File"                return 'type'
"Boolean"             return 'type'

/* Op Rel */
"or"                  return 'or'
"and"                 return 'and'
"not"                 return 'not'

/* Control */
"for"                 return 'for'
"while"               return 'while'
"do-while"            return 'dowhile'
"do"                  return 'do'
"if"                  return 'if'
"then"                return 'then'
"elseif"              return 'elseif'
"else"                return 'else'
"select"              return 'select'
"foreach"             return 'foreach'

/* Functions */
"function"            return 'function'
"void"                return 'void'

/* Others */
"class"               return 'class'
"end"                 return 'end'
"Type"                return 'newt'
"of"                  return 'of'
"ref"                 return 'ref'
"to"                  return 'to'
"in"                  return 'in'
"break"               return 'break'
"return"              return 'return'
"private"             return 'private'
"protected"           return 'protected'
"public"              return 'public'
"static"              return 'static'
"virtual"             return 'virtual'

[0-9]+\.[0-9]+([eE][+-]?[0-9]+)? return 'float'
[0-9]+([eE][+-]?[0-9]+)?                return 'int'
[a-zA-Z][a-zA-Z_0-9\-]*  return 'var'
[\'][^\']?[\']             return 'char'
["][^\"]*["]   return  'string'


"."                   return '.'
"["                   return '['
"]"                   return ']'
"{"                   return '{'
"}"                   return '}'
";"                   return ';'
"=="                  return '=='
"="                   return '='
">="                  return '>='
"<="                  return '<='
"!="                  return '!='
"%"                   return '%'
"<"                   return '<'
">"                   return '>'
"*"                   return '*'
"/"                   return '/'
"-"                   return '-'
"+"                   return '+'
"^"                   return '^'
"("                   return '('
":"                   return ':'
")"                   return ')'
","                   return ','
"PI"                  return 'PI'

<<EOF>>               return 'EOF'
.                     return 'INVALID'

/lex

/* operator associations and precedence */

%left '+' '-'
%left '*' '/'
%left '^'
%left UMINUS

%start START

%% /* language grammar */

START   : CHUNK { program = $1;}
        ;

CHUNK   : BLOCK LASTSTAT { $$ = new AstNode('Chunk', {left : $1, right :$2}); }
        ;

BLOCK   : BLOCK STAT { $$ = new AstNode('Block', {left : $1, right :$2}); }
        | { $$ = new AstNode('Empty'); }
        ;

LASTSTAT    : return EXP {;}
            | EOF {;}
            | {;}
            ;
            
STAT    : CLASS '=' EXP SCOLON { $$ = new AstNode('Asig', {left : $1, right :$3}); }
        | DEC SCOLON {$$ = new AstNode('Declaration', {left : $1, right :$2});}
        | NEWTYPE SCOLON {;}
        | array var 'of' POINT type DIM SCOLON {;} 
        | array var 'of' POINT var DIM SCOLON {;}
        | register var LIST end {;}
        | FUNCALL SCOLON {;}
        | while EXP do CHUNK end {;}
        | dowhile EXP CHUNK end {;}
        | if EXP then CHUNK ELSE end {$$ = new AstNode('If', {condition : $2, left :$4, right :$5});}
        | select COND end {;}
        | void var FUNCBODY CHUNK end {;}
        | function var FUNCBODY ':' type CHUNK end {;}
        | function var FUNCBODY ':' var CHUNK end {;}
        | for CLASS '=' EXP to EXP int do CHUNK end {;}
        | for CLASS '=' EXP to EXP var do CHUNK end {;}
        | foreach CLASS in CLASS end {;}
        | class var TIPO BODY {;}
        | comment {;}
        ;

TIPO    : '<' var '>' {;}
        | {;}
        ;

BODY    : protected ':' DEC SCOLON BODY {;}
        | private ':' DEC SCOLON BODY {;}
        | public ':' DEC SCOLON BODY {;}
        | DEC SCOLON BODY {;}
        | FUNCS {;}
        ;

FUNCS   : protected ':' TYPE void var FUNCBODY CHUNK end FUNCS {;}
        | protected ':' TYPE function var FUNCBODY ':' type CHUNK end FUNCS {;}
        | protected ':' TYPE function var FUNCBODY ':' var CHUNK end FUNCS {;}
        | private ':' TYPE void var FUNCBODY CHUNK end FUNCS {;}
        | private ':' TYPE function var FUNCBODY ':' type CHUNK end FUNCS {;}
        | private ':' TYPE function var FUNCBODY ':' var CHUNK end FUNCS {;}
        | public ':' TYPE void var FUNCBODY CHUNK end FUNCS {;}
        | public ':' TYPE function var FUNCBODY ':' type CHUNK end FUNCS {;}
        | public ':' TYPE function var FUNCBODY ':' var CHUNK end FUNCS {;}
        | TYPE void var FUNCBODY CHUNK end FUNCS {;}
        | TYPE function var FUNCBODY ':' type CHUNK end FUNCS {;}
        | TYPE function var FUNCBODY ':' var CHUNK end FUNCS {;}
        | end {;}
        ;

TYPE    : virtual {;}
        | static {;}
        | constant {;}
        | {;}
        ;

COND    : EXP ':' CHUNK end COND {;}
        | {;}
        ;

NEWTYPE : newt POINT type var {;}
        | newt array var 'of' POINT type '[' int '.' '.' int ']' NDIM {;}
        | newt array var 'of' POINT var '[' int '.' '.' int ']' NDIM {;}
        | newt register var LIST end {;}
        ;

POINT   : '*' {;}
        | {;}
        ;

LIST    : type POINT var LIST {;}
        | var POINT var LIST {;}
        | {;}
        ;


DIM     : '[' int '.' '.' int ']' NDIM {;}
        | '[' ']' '=' '{' LTYPES '}' {;}
        | {;}
        ;

NDIM    : '[' int '.' '.' int ']' NDIM {;}
        | {;}
        ;

LTYPES  : true LBOOL {;}
        | false LBOOL {;}
        | int LINT {;}
        | float LFLOAT {;}
        | string LSTRING {;}
        | char LCHAR {;}
        ;

LBOOL   : ',' true LBOOL {;}
        | ',' false LBOOL {;}
        | {;}
        ;

LINT    : ',' int LINT {;}
        | {;}
        ; 

LFLOAT  : ',' float LFLOAT {;}
        | {;}
        ;

LSTRING : ',' string LSTRING {;}
        | {;}
        ;      

LCHAR   : ',' char LCHAR {;}
        | {;}
        ; 

DEC     : constant type var ASIG CONTINUE {;}
        | TYPES POINT VAR ASIG CONTINUE {$$ = new AstNode( 'Static Declaration', {left : $1, right :$4, name: $3}); }
        | constant var var ASIG CONTINUE {;}
        | var POINT var ASIG CONTINUE {;}
        ;

VAR     : var {$$ = yytext;}
        ;

TYPES   : type {$$ = yytext;}
        ;

ASIG    : '=' EXP { $$ = new AstNode( 'Asignation', {left : $2}); }
        | {;}
        ;

CONTINUE: ',' POINT var ASIG CONTINUE {;}
        | {;}
        ;

SCOLON  : ';' {;}
        | {;}
        ;


EXP : not EXP {;}
    | MOD { $$ = new AstNode('Mod', {left : $1}); }
    ;
    
MOD : MOD '%' POWEROP {;}
    | POWEROP { $$ = new AstNode('Powerop', {left : $1}); }
    ;
    
POWEROP : POWEROP '^' DIVOP {;}
        | DIVOP { $$ = new AstNode('Divop', {left : $1}); }
        ;
    
DIVOP   : DIVOP '/' MULTOP { $$ = new AstNode('/', {left : $1, right : $3}); }
        | MULTOP { $$ = new AstNode('Multop', {left : $1}); }
        ;
    
MULTOP  : MULTOP '*' MINUSOP { $$ = new AstNode('*', {left : $1, right : $3}); }
        | MINUSOP { $$ = new AstNode('Minusop', {left : $1}); }
        ;
    
MINUSOP : MINUSOP '-' PLUSOP { $$ = new AstNode('-', {left : $1, right : $3}); }
        | PLUSOP { $$ = new AstNode('Plusop', {left : $1}); }
        ;
    
PLUSOP  : PLUSOP '+' LESSOP { $$ = new AstNode('+', {left : $1, right : $3}); }
        | LESSOP { $$ = new AstNode('Lessop', {left : $1}); }
        ;
            
LESSOP  : LESSOP '<' EQUALOP {;}
        | EQUALOP { $$ = new AstNode('Equalop', {left : $1}); }
        ;
            
EQUALOP : EQUALOP '==' GREATEROP { $$ = new AstNode('==', {left : $1, right : $3}); }
        | GREATEROP { $$ = new AstNode('Greaterop', {left : $1}); }
        ;
            
GREATEROP   : GREATEROP '>' NOTEQUALOP {;}
            | NOTEQUALOP { $$ = new AstNode('Notequalop', {left : $1}); }
            ;
            
NOTEQUALOP  : NOTEQUALOP '!=' ANDOP { $$ = new AstNode('!=', {left : $1, right : $3}); }
            | ANDOP { $$ = new AstNode('Andop', {left : $1}); }
            ;
            
ANDOP   : ANDOP and OROP { $$ = new AstNode('and', {left : $1, right : $3}); }
        | OROP { $$ = new AstNode('Orop', {left : $1}); }
        ;
            
OROP    : OROP or MEOP { $$ = new AstNode('or', {left : $1, right : $3}); }
        | MEOP { $$ = new AstNode('Meop', {left : $1}); }
        ;
        
MEOP    : MEOP '<=' GEOP {;}
        | GEOP { $$ = new AstNode('Geop', {left : $1}); }
        ;
        
GEOP    : GEOP '>=' BACKTRACK {;}
        | BACKTRACK { $$ = new AstNode('Backtrack', {left : $1}); }
        ;
    
BACKTRACK   : '(' EXP ')' { $$ = new AstNode('Exp', {left : $2}); }
            | nil { $$ = new AstNode('POINTER', {value : yytext}); }
            | true { $$ = new AstNode('BOOL', {value : yytext}); }
            | false { $$ = new AstNode('BOOL', {value : yytext}); }
            | string { $$ = new AstNode('STRING', {value : yytext}); }
            | float { $$ = new AstNode('REAL', {value : Number(yytext)}); }
			| char { $$ = new AstNode('CHAR', {value : yytext}); }
            | int { $$ = new AstNode('INT', {value : Number(yytext)}); }
            | '-' int { $$ = new AstNode('INT', {value : -Number(yytext)}); }
            | '+' int { $$ = new AstNode('INT', {value : Number(yytext)}); }
            | '-' float { $$ = new AstNode('REAL', {value : -Number(yytext)}); }
            | '+' float { $$ = new AstNode('REAL', {value : Number(yytext)}); }
            | '-' CLASS {;}
            | '+' CLASS {;}
            | CLASS { $$ = new AstNode('Class', {left : $1}); }
            | FUNCALL {;}
            ;
            
NVPAIR  : ',' CLASS '=' EXP NVPAIR {;} 
        | {;}
        ;

FUNCALL : CLASS '(' ARGS ')' {;}
        | CLASS '(' ')' {;}
        ;
        
CLASS   : ref var {;}
        | var { $$ = new AstNode('VAR', {name : yytext}); }
        | ref ARRAY {;}
        | ARRAY {;}
        | ref var '.' NCLASS {;}
        | var '.' NCLASS {;}
        | ref ARRAY '.' NCLASS {;}
        | ARRAY '.' NCLASS {;}
        ;

NCLASS  : var {;}
        | ARRAY {;}
        | var '.' NCLASS {;}
        | ARRAY '.' NCLASS {;}
        ; 

ARGS    : EXP ',' ARGS {;}    
        | EXP {;}
        ;
        
ARRAY   : var '[' EXP ']' {;}
        ;

ELSE    : elseif EXP then CHUNK {$$ = new AstNode('Elseif', {condition : $2, left : $4});}
        | else CHUNK {$$ = new AstNode('Else', {left : $2});}
        | {$$ = new AstNode('Empty');}
        ;

FUNCBODY    : '(' ')' {;}
            |'(' PARLIST ')' {;}
            ;

PARLIST : constant type var NEXT {;}
        | constant var var NEXT {;}
        | type var NEXT {;}
        | var var NEXT {;}
        ;

NEXT    : ',' PARLIST {;}
        | {;}
        ;