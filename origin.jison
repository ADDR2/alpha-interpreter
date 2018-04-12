/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex

%%
\s+                   /* skip whitespace */

"//"[^\/]*   return  'comment'

/* Values */
"true"                return 'true'
"false"               return 'false'
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
"do"                  return 'do'
"if"                  return 'if'
"then"                return 'then'
"elseif"              return 'elseif'
"else"                return 'else'
"select"              return 'select'
"foreach"             return 'foreach'

/* Functions */
"Println"             return 'println'
"Print"               return 'print'
"Read"                return 'read'
"function"            return 'function'
"void"                return 'void'

/* Others */
"class"               return 'class'
"end"                 return 'end'
"Type"                return 'newt'
"of"                  return 'of'
"dref"                return 'dref'
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
[a-zA-Z][a-zA-Z_0-9]*  return 'var'
[\'][^\']?[\']             return 'char'
["][^\"]*["]   return  'string'


"."                   return '.'
"?"                   return '?'
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
"_"                   return '_'
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

CHUNK   : BLOCK LASTSTAT { $$ = new AstNode('Chunk', {left : $1, right :$2, line : yylineno}); }
        ;

BLOCK   : BLOCK STAT { $$ = new AstNode('Block', {left : $1, right :$2, line : yylineno}); }
        | { $$ = new AstNode('Empty'); }
        ;

LASTSTAT    : return EXP { $$ = new AstNode('Return', {left: $2, line : yylineno}); }
            | EOF {;}
            | { $$ = new AstNode('Empty'); }
            ;
            
STAT    : CLASS '=' EXP SCOLON { $$ = new AstNode('Asig', {left : $1, right :$3, ref: false, line : yylineno}); }
        | dref CLASS '=' EXP SCOLON { $$ = new AstNode('Asig', {left : $2, right :$4, ref: true, line : yylineno}); }
        | DEC SCOLON {$$ = new AstNode('Declaration', {left : $1, right :$2, line : yylineno});}
        | NEWTYPE SCOLON {$$ = new AstNode('NewType', {left : $1, line : yylineno});}
        | array VAR of POINT TOV DIM SCOLON { $$ = new AstNode('Array', {name : $2, tov : $5, left :$6, line : yylineno}); } 
        | register VAR LIST end { $$ = new AstNode('Register', {name : $2, left :$3, line : yylineno}); }
        | FUNCALL SCOLON { $$ = new AstNode('Funcall', {left :$1, line : yylineno}); }
        | while EXP do CHUNK end {$$ = new AstNode('While', {condition : $2, left :$4, line : yylineno});}
        | do CHUNK '_' while EXP {$$ = new AstNode('Do', {condition : $5, left :$2, line : yylineno});}
        | if EXP then CHUNK ELSE end {$$ = new AstNode('If', {condition : $2, left :$4, right :$5, line : yylineno});}
        | select COND end {$$ = new AstNode('Select', {left :$2, line : yylineno});}
        | void VAR FUNCBODY CHUNK end {$$ = new AstNode('Void', {name : $2, left :$3, right :$4, line : yylineno});}
        | function var FUNCBODY ':' TOV CHUNK end {$$ = new AstNode('Function', {name : $2, left :$3, right :$6, ret : $5, line : yylineno});}
        | for CLASS '=' EXP to EXP IVN do CHUNK end {$$ = new AstNode('For', {id : $2, init :$4, end :$6, inc : $7, left : $9, line : yylineno});}
        | foreach VAR in VAR CHUNK end {$$ = new AstNode('Foreach', {element: $2, array: $4, left: $5, line : yylineno});}
        | class var TIPO BODY {;}
        | comment { $$ = new AstNode('Empty'); }
        ;

TOV     : type {$$ = yytext;}
        | var {$$ = yytext;}
        ;

IVN     : int {$$ = new AstNode('INT', {value : Number(yytext)});}
        | var {$$ = new AstNode('VAR', {name : yytext});}
        | {$$ = new AstNode('INT', {value : 1});}
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

COND    : EXP ':' CHUNK end COND {$$ = new AstNode('Cond', {condition : $1, left :$3, right :$5, line : yylineno});}
        | { $$ = new AstNode('Empty'); }
        ;

NEWTYPE : newt POINT type var {$$ = new AstNode( 'VarType', {name : $4, left :$3, line : yylineno}); }
        | newt array var 'of' POINT TOV '[' int '.' '.' int ']' NDIM {;}
        | newt register var LIST end {$$ = new AstNode( 'RegisterType', {name : $3, left :$4, line : yylineno}); }
        ;

POINT   : '*' { $$ = true;}
        | { $$ = false;}
        ;

LIST    : TOV POINT VAR LIST { $$ = new AstNode('List', {left : $1, right :$3, next : $4, point: $2, line : yylineno}); }
        | { $$ = new AstNode('Empty'); }
        ;


DIM     : '[' IOV '.' '.' IOV ']' NDIM {$$ = new AstNode('Dim', {init : $2, end :$5, left :$7, line : yylineno});}
        | '[' ']' '=' '{' LTYPES '}' {$$ = new AstNode('Init', {left : $5, line : yylineno});}
        | { $$ = new AstNode('Empty'); }
        ;

IOV     : int {$$ = new AstNode('INT', {value : Number(yytext)});}
        | var {$$ = new AstNode('VAR', {name : yytext});}
        ;

NDIM    : '[' IOV '.' '.' IOV ']' NDIM {$$ = new AstNode('Ndim', {init : $2, end :$5, left :$7, line : yylineno});}
        | { $$ = new AstNode('Endim'); }
        ;

LTYPES  : EXP ',' LTYPES {$$ = new AstNode('NextType', {left : $1, right : $3, line : yylineno});}
        | EXP {$$ = new AstNode('FinalType', {left : $1, line : yylineno});}
        ;

DEC     : constant type var ASIG CONTINUE {;}
        | TYPES POINT VAR ASIG CONTINUE {$$ = new AstNode( 'Static Declaration', {left : $1, right :$4, name: $3, next: $5, point: $2, line : yylineno}); }
        | constant var var ASIG CONTINUE {;}
        | var POINT VAR ASIG CONTINUE {$$ = new AstNode( 'Static Declaration', {left : $1, right :$4, name: $3, next: $5, point: $2, line : yylineno}); }
        ;

VAR     : var {$$ = yytext;}
        ;

TYPES   : type {$$ = yytext;}
        ;

ASIG    : '=' EXP { $$ = new AstNode( 'Asignation', {left : $2, line : yylineno}); }
        | { $$ = new AstNode('Empty'); }
        ;

CONTINUE: ',' POINT VAR ASIG CONTINUE {$$ = new AstNode( 'Next Declaration', {left : $4, right :$5, name: $3, point: $2, line : yylineno}); }
        | { $$ = new AstNode('Empty'); }
        ;

SCOLON  : ';' {;}
        | {;}
        ;


EXP : EXP or ANDOP { $$ = new AstNode('or', {left : $1, right : $3, line : yylineno}); }
    | ANDOP { $$ = new AstNode('Andop', {left : $1, line : yylineno}); }
    ;
            
ANDOP   : ANDOP and NOT { $$ = new AstNode('and', {left : $1, right : $3, line : yylineno}); }
        | NOT { $$ = new AstNode('Not', {left : $1, line : yylineno}); }
        ;
            
NOT     : not NOT { $$ = new AstNode('not', {left : $2, line : yylineno}); }
        | NOTEQUALOP { $$ = new AstNode('Notequalop', {left : $1, line : yylineno}); }
        ;

NOTEQUALOP  : NOTEQUALOP '!=' EQUALOP { $$ = new AstNode('!=', {left : $1, right : $3, line : yylineno}); }
            | EQUALOP { $$ = new AstNode('Equalop', {left : $1, line : yylineno}); }
            ;

EQUALOP : EQUALOP '==' MEOP { $$ = new AstNode('==', {left : $1, right : $3, line : yylineno}); }
        | MEOP { $$ = new AstNode('Meop', {left : $1, line : yylineno}); }
        ;
        
MEOP    : MEOP '<=' GEOP { $$ = new AstNode('<=', {left : $1, right : $3, line : yylineno}); }
        | GEOP { $$ = new AstNode('Geop', {left : $1, line : yylineno}); }
        ;
        
GEOP    : GEOP '>=' LESSOP { $$ = new AstNode('>=', {left : $1, right : $3, line : yylineno}); }
        | LESSOP { $$ = new AstNode('Lessop', {left : $1, line : yylineno}); }
        ;

LESSOP  : LESSOP '<' GREATEROP { $$ = new AstNode('<', {left : $1, right : $3, line : yylineno}); }
        | GREATEROP { $$ = new AstNode('Greaterop', {left : $1, line : yylineno}); }
        ;

GREATEROP   : GREATEROP '>' MINUSOP { $$ = new AstNode('>', {left : $1, right : $3, line : yylineno}); }
            | MINUSOP { $$ = new AstNode('Minusop', {left : $1, line : yylineno}); }
            ;

MINUSOP : MINUSOP '-' PLUSOP { $$ = new AstNode('-', {left : $1, right : $3, line : yylineno}); }
        | PLUSOP { $$ = new AstNode('Plusop', {left : $1, line : yylineno}); }
        ;

PLUSOP  : PLUSOP '+' MOD { $$ = new AstNode('+', {left : $1, right : $3, line : yylineno}); }
        | MOD { $$ = new AstNode('Mod', {left : $1, line : yylineno}); }
        ;

MOD     : MOD '%' DIVOP { $$ = new AstNode('%', {left : $1, right : $3, line : yylineno}); }
        | DIVOP { $$ = new AstNode('Divop', {left : $1, line : yylineno}); }
        ;

DIVOP   : DIVOP '/' MULTOP { $$ = new AstNode('/', {left : $1, right : $3, line : yylineno}); }
        | MULTOP { $$ = new AstNode('Multop', {left : $1, line : yylineno}); }
        ;

MULTOP  : MULTOP '*' POWEROP { $$ = new AstNode('*', {left : $1, right : $3, line : yylineno}); }
        | POWEROP { $$ = new AstNode('Powerop', {left : $1, line : yylineno}); }
        ;

POWEROP : POWEROP '^' BACKTRACK { $$ = new AstNode('^', {left : $1, right : $3, line : yylineno}); }
        | BACKTRACK { $$ = new AstNode('Backtrack', {left : $1, line : yylineno}); }
        ;
    
BACKTRACK   : '(' EXP ')' { $$ = new AstNode('Exp', {left : $2, line : yylineno}); }
            | nil { $$ = new AstNode('POINTER', {value : yytext}); }
            | null { $$ = new AstNode('POINTER', {value : yytext}); }
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
            | dref CLASS { $$ = new AstNode('Pointer', {left : $2, line : yylineno}); }
            | CLASS { $$ = new AstNode('Class', {left : $1, line : yylineno}); }
            | FUNCALL { $$ = new AstNode('Funcall', {left :$1, line : yylineno}); }
            ;
            
NVPAIR  : ',' CLASS '=' EXP NVPAIR {;} 
        | {;}
        ;

FUNCALL : CLASS '(' ARGS ')' { $$ = new AstNode('Call', {left : $1, right :$3, line : yylineno}); }
        | CLASS '(' ')' { $$ = new AstNode('EmptyCall', {left : $1, line : yylineno}); }
        | print '(' ARGS ')' { $$ = new AstNode('Print', {left : $3, line : yylineno}); }
        | println '(' ARGS ')' { $$ = new AstNode('Println', {left : $3, line : yylineno}); }
        | read '(' VARS ')' { $$ = new AstNode('Read', {left : $3, line : yylineno}); } 
        ;

VARS    : CLASS ',' VARS { $$ = new AstNode('Vars', {left : $1, right :$3, line : yylineno}); }
        | CLASS { $$ = new AstNode('FinalVars', {left : $1, line : yylineno}); }
        ;
        
CLASS   : var { $$ = new AstNode('VAR', {name : yytext, line : yylineno}); }
        | var '[' EXP ']' ARRAY { $$ = new AstNode('ARRAY', {name : $1, index : $3, left : $5, line : yylineno}); }
        | var '.' NCLASS { $$ = new AstNode('Object', {name : $1, left : $3, line : yylineno}); }
        | var '[' EXP ']' ARRAY '.' NCLASS { $$ = new AstNode('Complex Array', {name : $1, index : $3, left: $5, right: $7, line : yylineno}); }
        ;

NCLASS  : var { $$ = new AstNode('FinalVar', {name : yytext, line : yylineno}); }
        | var '[' EXP ']' {;}
        | var '.' NCLASS { $$ = new AstNode('NextVar', {name : $1, left: $3, line : yylineno}); }
        | var '[' EXP ']' '.' NCLASS {;}
        ; 

ARGS    : EXP ',' ARGS { $$ = new AstNode('Args', {left : $1, right :$3, line : yylineno}); }    
        | EXP { $$ = new AstNode('FinalArg', {left : $1, line : yylineno}); }
        ;

ARRAY   : '[' EXP ']' ARRAY { $$ = new AstNode('ARR', {index : $2, left : $4, line : yylineno}); }
        | { $$ = new AstNode('EndARR'); }
        ;

ELSE    : elseif EXP then CHUNK {$$ = new AstNode('Elseif', {condition : $2, left : $4, line : yylineno});}
        | else CHUNK {$$ = new AstNode('Else', {left : $2, line : yylineno});}
        | {$$ = new AstNode('Empty');}
        ;

FUNCBODY    : '(' ')' { $$ = new AstNode('Empty'); }
            |'(' PARLIST ')' {$$ = new AstNode('Params', {left : $2, line : yylineno});}
            ;

PARLIST : type var NEXT {$$ = new AstNode('TypeParam', {next : $3, left : $1, right: $2, line : yylineno});}
        | var var NEXT {;} 
        | constant type var NEXT {;}
        | constant var var NEXT {;}
        ;

NEXT    : ',' PARLIST {$$ = new AstNode('Next', {left : $2, line : yylineno});}
        | { $$ = new AstNode('Empty'); }
        ;