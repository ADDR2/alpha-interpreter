const Emitter = new (require('events'))();
			
			var DataStructures = {
			    stack : function() {                  
			        var elements;
			        
			        this.push = function(element) {
			            if (typeof(elements) === 'undefined') {
			                elements = [];   
			            }                            
			            elements.push(element);
			        }
			        this.pop = function() {
			            return elements.pop();
			        }
			        this.top = function(element) {
			            return elements[elements.length - 1];
			        }
			        this.size = function(){
			        	return elements.length;
			        }
			        this.find = function(index){
			        	return elements[index];
			        }
			    }
			}

			Object.size = function(obj) {
    			var size = 0, key;
    			for (key in obj) {
       			if (obj.hasOwnProperty(key)) size++;
   				}
  			 	return size;
			};

			var program;
			var aux_type;
			var list = [];
			var printlist = [];
			var rtoprint = false;

			function FindScope(name, index){
				if (index < 0){
					return [];
				}
				if (index >= 0){
					if (name in executionstack.find(index)){
						return executionstack.find(index);
					}
					return FindScope(name, index-1);
				}
			}


			function Value(astNode){
				if(!astNode){
					console.log("Error en la linea " + (astNode.line+1) + ": Las funciones deben retornar algun valor");
					return null;
				}
				if(astNode.type == 'Var'){
					if(!(astNode.name in FindScope(astNode.name, executionstack.size()-1))) {
						console.log("Error en la linea " + (astNode.line+1) + ": La variable "+astNode.name+" no existe");
						return null;
					}else{
						astNode = new AstNode(FindScope(astNode.name, executionstack.size()-1)[astNode.name].type, {value : FindScope(astNode.name, executionstack.size()-1)[astNode.name].value});
					}
				}
				if (astNode.type == 'Array'){
					if(!(astNode.name in FindScope(astNode.name, executionstack.size()-1))) {
						console.log("Error en la linea " + (astNode.line+1) + ": El arreglo "+astNode.name+" no existe");
						return null;
					}else{
						var rgid = FindScope(astNode.name, executionstack.size()-1)[astNode.name];
						if(astNode.dims == rgid.dim){
							var formula = 0;
							var aux = 1;
							var cont = rgid.dim;
							var ind = astNode.ind.split(" ");
							for (var i = 0; i < rgid.dims.length; i+=2){
								if (!(parseInt(ind[i/2]) >= rgid.dims[i] && parseInt(ind[i/2]) <= rgid.dims[i+1])){
									console.log("Error en la linea " + (astNode.line+1) + ": El indice "+ind[i/2]+" no esta dentro de los limites del arreglo ("+rgid.dims[i]+","+rgid.dims[i+1]+")");
									return null;
								}
								cont = rgid.dim-1;
								while (cont > i/2){
									aux = aux*(rgid.dims[cont*2+1]-rgid.dims[cont*2]+1);
									cont--; 
								} 
								formula += aux*(parseInt(ind[i/2])-rgid.dims[i]);
								console.log("formula = "+formula+" "+ind[i/2]+" "+rgid.dims[i]);
								aux = 1;
							}
							console.log(astNode.name+"["+formula+"]");
							var help = FindScope(rgid.of, executionstack.size()-1);
							if (rgid.of in help){
								if(help[rgid.of].type == 'Register'){
									astNode = new AstNode(findItem(astNode.access, rgid.array[formula]).type, {value : findItem(astNode.access, rgid.array[formula]).value});
								}else{
									astNode = new AstNode(help[rgid.of].type, {value : rgid.array[formula].value});
								}
							}else{
								astNode = new AstNode(rgid.of, {value : rgid.array[formula]});
							}
						}
					}
				}
				if (astNode.type == 'Register'){
					if(!(astNode.name in FindScope(astNode.name, executionstack.size()-1))) {
						console.log("Error en la linea " + (astNode.line+1) + ": El registro "+astNode.name+" no existe");
						return null;
					}else{
						var alias = findItem(astNode.access, FindScope(astNode.name, executionstack.size()-1));
						if (alias.type == 'Pointer'){
							alias = alias.dir;
						}
						astNode = new AstNode(alias.type, {value: alias.value});
					}
				}
				if (astNode.type == 'Pointer'){
					astNode = new AstNode('Pointer' , {value: null});
				}
				return astNode;
			}

			function isArray(object)
			{
			    if (object.constructor === Array) return true;
			    else return false;
			}

			function clone(obj){
    			var copy = [];
				for (var attr in obj) {
					if(obj[attr] == null)
						copy[attr] = null;
					else{
						if (obj[attr].type == 'Integer' || obj[attr].type == 'String' || obj[attr].type == 'Char' || obj[attr].type == 'Boolean' || obj[attr].type == 'Real'){
							copy[attr] = new AstNode(obj[attr].type, {value: obj[attr].value, origin: obj[attr].origin});
						}else{
							if (obj[attr].type == 'Pointer'){
								copy[attr] = new AstNode(obj[attr].type, {dir: obj[attr].dir, pt: obj[attr].pt, name: obj[attr].name});
							}else{
								copy[attr] = new AstNode('Register', {elements: clone(obj[attr].elements), origin: obj[attr].origin});
							}
						}
					}
    			}
				return copy;
			}

			function findItem(access, list){
				var i = 0;
				var token;
				while (access[i] != '.' && i < access.length){
					i++;
				}
				token = access.substr(0, i);
				if(list.type == 'Register'){
					if(token in list.elements && list.elements[token] == null){
						list.elements[token] = new AstNode('Register', {elements: clone(list.elements), origin: list.origin});
					}
					list = list.elements;
				}
				if(!(token in list)){
					console.log("Error en la linea " + (astNode.line+1) + ": No se encontro el item "+token);
					return null;
				}
				if (access[i] == '.'){
					if (list[token].type == 'Pointer'){
						return findItem(access.substr(i+1, access.length-1), list[token].dir);
					}
					return findItem(access.substr(i+1, access.length-1), list[token]);
				}else{
					return list[token];
				}
			}

			function PointerValue(astNode){
				if (astNode.type == 'Var'){
					return FindScope(astNode.name, executionstack.size()-1)[astNode.name];
				}
				if(FindScope(astNode.name, executionstack.size()-1)[astNode.name].type == 'Register'){
					return findItem(astNode.access, FindScope(astNode.name, executionstack.size()-1));
				}
			}

			function FindType(type){
				var copy = {};

				for (var attr in FindScope(type, executionstack.size()-1)[type]) {
       				if (FindScope(type, executionstack.size()-1)[type].hasOwnProperty(attr)) copy[attr] = FindScope(type, executionstack.size()-1)[type][attr];
       				if(isArray(copy[attr])) copy[attr] = clone(copy[attr]);
    			}
				return copy;
			}

			function GiveType(type){
				return FindScope(type, executionstack.size()-1)[type];
			}

			function GetType(data){
				if(data.length < 2){
					if (parseInt(data)) return 'Integer';
					else return 'Char';
				}else{
					if (parseInt(data).toString().length != data.length || parseInt(data) == "NaN"){
						if (parseFloat(data).toString().length != data.length || parseFloat(data) == "NaN"){
							if (data == 'true' || data == 'false'){
								return 'Boolean';
							}
							return 'String';
						}else{
							return 'Real';
						}
					}else{
						return 'Integer';
					}
				}
			}

			function AstNode(type, params) {
				this.type = type;
				for(var key in params){ this[key] = params[key];}
				return this;
			}

			var finish = null;

			function eval(astNode) {
				var v;
				switch(astNode.type) {
					case 'Chunk': 
						var lf = eval(astNode.left);
						if (lf){
							v = lf;
						}else{
							var rg = eval(astNode.right);
							v = rg;
						}
					break;
					case 'Block': 
						v = eval(astNode.left);
						if (!v){
							v = eval(astNode.right);
						}
					break;
					case 'Declaration': 
						v = eval(astNode.left); 
					break;
					case 'Static Declaration':
						var rg = eval(astNode.right);
						if (astNode.left in FindScope(astNode.left, executionstack.size()-1) && !(astNode.name in executionstack.top())){
							aux_type = astNode.left;
							if (astNode.point){
								executionstack.top()[astNode.name] = new AstNode('Pointer', {dir: null, pt: FindType(astNode.left).origin, name: null});
								console.log("pointer detected");
								if (rg){
									if (rg.type == 'Pointer'){
										executionstack.top()[astNode.name].dir = null;
										executionstack.top()[astNode.name].name = null;
									}else{
										if (executionstack.top()[astNode.name].pt == PointerValue(rg).origin){
											executionstack.top()[astNode.name].dir = PointerValue(rg);
											executionstack.top()[astNode.name].name = rg.name;
										}else{
											if (PointerValue(rg).type == 'Pointer' && PointerValue(rg).pt == executionstack.top()[astNode.name].pt){
												executionstack.top()[astNode.name] = PointerValue(rg);
											}else{
												console.log("Error en la linea " + (astNode.line+1) + ": Mala asignacion de apuntador");
												return null;
											}
										}
									}
								}
							}else{
								executionstack.top()[astNode.name] = FindType(astNode.left);
								if (rg != null){
									rg = Value(rg);
									if(executionstack.top()[astNode.name].type == rg.type){
										console.log("buena declaracion");
									}else{
										if (executionstack.top()[astNode.name].type == 'Integer' && rg.type == 'Real'){
											rg.value = parseInt(rg.value);
											rg.type = 'Integer';
											console.log("buena transformacion a Integer "+rg.value);
										}else{
											if (executionstack.top()[astNode.name].type == 'Real' && rg.type == 'Integer'){
												rg.value = parseFloat(rg.value);
												rg.type = 'Real';
												console.log("buena transformacion a Real "+rg.value);
											}else{
												console.log("Error en la linea " + (astNode.line+1) + ": No se puede asignar el valor");
												return null;
											}
										}
									}
									executionstack.top()[astNode.name].value = rg.value;
									console.log("valor "+executionstack.top()[astNode.name].value);
								}
							}
						}else{
							aux_type = astNode.left;
							if (astNode.left == 'Integer' || astNode.left == 'Char' || astNode.left == 'String' || astNode.left == 'Boolean' || astNode.left == 'Real'){ 
								if (astNode.point){
									executionstack.top()[astNode.name] = new AstNode('Pointer', {dir: null, pt: astNode.left, name: null});
									console.log("pointer detected");
									if (rg){
										if (rg.type == 'Pointer'){
											executionstack.top()[astNode.name].dir = null;
											executionstack.top()[astNode.name].name = null;
										}else{
											if (executionstack.top()[astNode.name].pt == PointerValue(rg).type){
												executionstack.top()[astNode.name].dir = PointerValue(rg);
												executionstack.top()[astNode.name].name = rg.name;
											}else{
												if (PointerValue(rg).type == 'Pointer' && PointerValue(rg).pt == executionstack.top()[astNode.name].pt){
													executionstack.top()[astNode.name] = PointerValue(rg);
												}else{
													console.log("Error en la linea " + (astNode.line+1) + ": Mala asignacion de apuntador");
													return null;
												}
											}
										}
									}
								}else{
									if (rg){
										rg = Value(rg);
										if(astNode.left == rg.type){
											console.log("buena declaracion");
										}else{
											if (astNode.left == 'Integer' && rg.type == 'Real'){
												rg.value = parseInt(rg.value);
												rg.type = 'Integer';
												console.log("buena transformacion a Integer "+rg.value);
											}else{
												if (astNode.left == 'Real' && rg.type == 'Integer'){
													rg.value = parseFloat(rg.value);
													rg.type = 'Real';
													console.log("buena transformacion a Real "+rg.value);
												}else{
													console.log("Error en la linea " + (astNode.line+1) + ": No se puede asignar el valor");
													return null;
												}
											}
										}
										if(!(astNode.name in executionstack.top())) {
											executionstack.top()[astNode.name] = rg;
											executionstack.top()[astNode.name].origin = astNode.name;
											console.log("valor "+executionstack.top()[astNode.name].value);
										}else{
											console.log("Error en la linea " + (astNode.line+1) + ": La variable "+astNode.name+" ya esta declarada");
										}
									}else{
										executionstack.top()[astNode.name] = new AstNode(astNode.left, {value : null, origin: astNode.name});
										console.log("La variable "+astNode.name+" no tiene valor");
									}
								}
							}else{
								console.log("Error en la linea " + (astNode.line+1) + ": El tipo de dato " + astNode.left + " se desconoce");
								return null;
							}
						}
						v = eval(astNode.next);
					break;
					case 'VarType':
						if(!(astNode.name in executionstack.top())) {
							executionstack.top()[astNode.name] = new AstNode(astNode.left, {value : null, origin: astNode.name});
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": El nombre "+astNode.name+" ya existe");
							return null;
						}
					break;
					case 'Next Declaration':
						var lf = eval(astNode.left);
						if (aux_type in FindScope(aux_type, executionstack.size()-1) && !(astNode.name in executionstack.top())){
							executionstack.top()[astNode.name] = FindType(aux_type);
							if (lf != null){
								lf = Value(lf);
								if(executionstack.top()[astNode.name].type == lf.type){
									console.log("buena declaracion");
								}else{
									if (executionstack.top()[astNode.name].type == 'Integer' && lf.type == 'Real'){
										lf.value = parseInt(lf.value);
										lf.type = 'Integer';
										console.log("buena transformacion a Integer "+lf.value);
									}else{
										if (executionstack.top()[astNode.name].type == 'Real' && lf.type == 'Integer'){
											lf.value = parseFloat(lf.value);
											lf.type = 'Real';
											console.log("buena transformacion a Real "+lf.value);
										}else{
											console.log("Error en la linea " + (astNode.line+1) + ": No se puede asignar el valor");
											return null;
										}
									}
								}
								executionstack.top()[astNode.name].value = lf.value;
								console.log("valor "+executionstack.top()[astNode.name].value);
							}
						}else{
							if (aux_type == 'Integer' || aux_type == 'Char' || aux_type == 'String' || aux_type == 'Boolean' || aux_type == 'Real'){
								if (lf != null){
									lf = Value(lf);
									if(aux_type == lf.type){
										console.log("buena declaracion");
									}else{
										if (aux_type == 'Integer' && lf.type == 'Real'){
											lf.value = parseInt(lf.value);
											lf.type = 'Integer';
											console.log("buena transformacion a Integer "+lf.value);
										}else{
											if (aux_type == 'Real' && lf.type == 'Integer'){
												lf.value = parseFloat(lf.value);
												lf.type = 'Real';
												console.log("buena transformacion a Real "+lf.value);
											}else{
												console.log("Error en la linea " + (astNode.line+1) + ": No se puede asignar el valor");
												return null;
											}
										}
									}
									if(!(astNode.name in executionstack.top())) {
										executionstack.top()[astNode.name] = lf;
										executionstack.top()[astNode.name].origin = astNode.name;
										console.log("valor "+executionstack.top()[astNode.name].value);
									}else{
										console.log("Error en la linea " + (astNode.line+1) + ": La variable "+astNode.name+" ya esta declarada");
									}
								}else{
									executionstack.top()[astNode.name] = new AstNode(aux_type, {value : null, origin: astNode.name});
									console.log("La variable "+astNode.name+" no tiene valor");
								}
							}else{
								console.log("Error en la linea " + (astNode.line+1) + ": El tipo de dato " + aux_type + " se desconoce");
								return null;
							}
						}
						v = eval(astNode.right);
					break;
					case 'Asig':
						var lf = eval(astNode.left);
						if (astNode.ref){
							if(!(lf.name in FindScope(lf.name, executionstack.size()-1)) || FindScope(lf.name, executionstack.size()-1)[lf.name].type != 'Pointer') {
								console.log("Error en la linea " + (astNode.line+1) + ": El apuntador "+lf.name+" no ha sido declarado");
								return null;
							}else{
								lf.name = FindScope(lf.name, executionstack.size()-1)[lf.name].name;
								if (lf.type == 'Register'){
									var i = 0;
									while(lf.access[i] != '.')
										i++;
									lf.access = lf.name + lf.access.substr(i, lf.access.length-1);
								}
							}
						}
						if(lf.name in FindScope(lf.name, executionstack.size()-1)) {
							var rg = eval(astNode.right);
							if (FindScope(lf.name, executionstack.size()-1)[lf.name].type == 'Pointer'){
								if (rg.type == 'Pointer'){
									FindScope(lf.name, executionstack.size()-1)[lf.name].dir = null;
									FindScope(lf.name, executionstack.size()-1)[lf.name].name = null;
								}else{
									if(FindScope(lf.name, executionstack.size()-1)[lf.name].pt == PointerValue(rg).type || FindScope(lf.name, executionstack.size()-1)[lf.name].pt == PointerValue(rg).origin){
										FindScope(lf.name, executionstack.size()-1)[lf.name].dir = PointerValue(rg);
										FindScope(lf.name, executionstack.size()-1)[lf.name].name = rg.name;
									}else{
										if (PointerValue(rg).type == 'Pointer' && PointerValue(rg).pt == FindScope(lf.name, executionstack.size()-1)[lf.name].pt){
											FindScope(lf.name, executionstack.size()-1)[lf.name] = PointerValue(rg);
										}else{
											console.log("Error en la linea " + (astNode.line+1) + ": Mala asignacion de apuntador");
											return null;
										}
									}
								}
							}else{ 
								var id = FindScope(lf.name, executionstack.size()-1)[lf.name];
								if (lf.type == 'Var'){
									rg = Value(rg);
									if (id.type == rg.type){
										FindScope(lf.name, executionstack.size()-1)[lf.name].value = rg.value;
									}else{
										if(id.type == 'Integer' && rg.type == 'Real'){
											FindScope(lf.name, executionstack.size()-1)[lf.name].value = parseInt(rg.value);
										}else{
											if(id.type == 'Real' && rg.type == 'Integer'){
												FindScope(lf.name, executionstack.size()-1)[lf.name].value = parseFloat(rg.value);
											}else{
												console.log("Error en la linea " + (astNode.line+1) + ": La variable "+lf.name+" no es del tipo "+rg.type);
												return null;		
											}
										}
									}
								}else{
									if (lf.type == 'Array'){
										rg = Value(rg);
										if(lf.dims == id.dim && FindScope(lf.name, executionstack.size()-1)[lf.name].type == 'Array'){
											var formula = 0;
											var aux = 1;
											var cont = id.dim;
											var ind = lf.ind.split(" ");
											for (var i = 0; i < id.dims.length; i+=2){
												if (!(parseInt(ind[i/2]) >= id.dims[i] && parseInt(ind[i/2]) <= id.dims[i+1])){
													console.log("Error en la linea " + (astNode.line+1) + ": El indice "+ind[i/2]+" no esta dentro de los limites del arreglo ("+id.dims[i]+","+id.dims[i+1]+")");
													return null;
												}
												cont = id.dim-1;
												while (cont > i/2){
													aux = aux*(id.dims[cont*2+1]-id.dims[cont*2]+1);
													cont--; 
												} 
												formula += aux*(parseInt(ind[i/2])-id.dims[i]);
												console.log("formula = "+formula+" "+ind[i/2]+" "+id.dims[i]);
												aux = 1;
											}
											aux_type = id.of;
											if (id.of in FindScope(id.of, executionstack.size()-1)){
												FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula] = FindScope(id.of, executionstack.size()-1)[id.of];
												aux_type = FindScope(id.of, executionstack.size()-1)[id.of].type;
											}
											if(aux_type == 'Register'){
												if (findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).type == rg.type){
													findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).value = rg.value;
												}else{
													if(findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).type == 'Integer' && rg.type == 'Real'){
														findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).value = parseInt(rg.value);
													}else{
														if(findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).type == 'Real' && rg.type == 'Integer'){
															findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).value = parseFloat(rg.value);
														}else{
															console.log("Error en la linea " + (astNode.line+1) + ": El campo del registro "+lf.name+" no es del tipo "+rg.type);
															return null;		
														}
													}
												}
											}else{
												id.of = aux_type;
												if (id.of == rg.type){
													FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula] = rg.value;
												}else{
													if(id.of == 'Integer' && rg.type == 'Real'){
														FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula] = parseInt(rg.value);
													}else{
														if(id.of == 'Real' && rg.type == 'Integer'){
															FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula] = parseFloat(rg.value);
														}else{
															console.log("Error en la linea " + (astNode.line+1) + ": El arreglo "+lf.name+" no es del tipo "+rg.type);
															return null;		
														}
													}
												}
												console.log(lf.name+"["+formula+"] = "+FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]);
											}
										}else{
											console.log("Error en la linea " + (astNode.line+1) + ": No se ha declarado el arreglo "+lf.name);
											return null;
										}
									}else{
										if (lf.type == 'Register'){
											var temp = findItem(lf.access, FindScope(lf.name, executionstack.size()-1));
											if (temp.type == 'Pointer'){
												if (rg.type == 'Pointer'){
													findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).dir = null;
													findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).name = null;
												}else{
													if (temp.pt == PointerValue(rg).type || temp.pt == PointerValue(rg).origin){
														findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).dir = PointerValue(rg);
														findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).name = rg.name;
													}else{
														if(PointerValue(rg).type == 'Pointer' && temp.pt == PointerValue(rg).pt){
															findItem(lf.access, FindScope(lf.name, executionstack.size()-1)) = PointerValue(rg);
														}else{
															console.log("Error en la linea " + (astNode.line+1) + ": Mala asignacion de apuntador");
															return null;
														}
													}
												}
											}else{
												rg = Value(rg);
												if (temp.type == rg.type){
													findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).value = rg.value;
												}else{
													if(temp.type == 'Integer' && rg.type == 'Real'){
														findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).value = parseInt(rg.value);
													}else{
														if(temp.type == 'Real' && rg.type == 'Integer'){
															findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).value = parseFloat(rg.value);
														}else{
															console.log("Error en la linea " + (astNode.line+1) + ": El campo del registro "+lf.name+" no es del tipo "+rg.type);
															return null;		
														}
													}
												}
											}
											console.log("El valor guardado es "+findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).value);
										}else{
											console.log("Error en la linea " + (astNode.line+1) + ": Solo se pueden asignar valores a variables o arreglos");
											return null;
										}
									}
								}
							}
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": La variable "+lf.name+" no existe");
							return null;
						}
					break;
					case 'Register':
						if(!(astNode.name in executionstack.top())) {
							list = [];
							aux_type = astNode.name;
							eval(astNode.left);
							executionstack.top()[astNode.name] = new AstNode('Register', {elements: list, origin: astNode.name});
							aux_type = "";
							console.log("El registro "+astNode.name+" tiene "+Object.size(executionstack.top()[astNode.name].elements)+" elementos");
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": La variable "+astNode.name+" ya existe");
							return null;
						}
					break;
					case 'List':
						if(!(astNode.right in list)) {
							var lf = astNode.left;
							if(lf != 'Integer' && lf != 'Real' && lf != 'String' && lf != 'Char' && lf != 'Boolean'){
								if(lf in FindScope(lf, executionstack.size()-1)) {
									if (astNode.point){
										list[astNode.right] = new AstNode('Pointer', {dir: null, pt: FindType(lf).origin, name: null});
									}else{
										list[astNode.right] = FindType(lf);
									}
								}else{
									if( lf == aux_type ){
										if(astNode.point){
											list[astNode.right] = new AstNode('Pointer', {dir: null, pt: aux_type, name: null});
										}else{
											list[astNode.right] = null;
										}
									}else{
										console.log("Error en la linea " + (astNode.line+1) + ": El tipo "+lf+" no ha sido definido");
										list[astNode.right] = new AstNode('undefined');
										return null;
									}
								}
							}else{
								if (astNode.point){
									list[astNode.right] = new AstNode('Pointer', {dir: null, pt: lf, name: null});
								}else{
									list[astNode.right] = new AstNode(lf, {value: null, origin: astNode.right});
								}
							}
							eval(astNode.next);
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": La variable "+astNode.right+" ya existe");
							return null;
						}
					break;
					case 'NewType':
						v = eval(astNode.left);
					break;
					case 'Array':
						aux_type = astNode.tov;
						list = [];
						var dim = eval(astNode.left);
						if(!(astNode.name in executionstack.top())) {
							if(list.length <= 0){
								var element = [];
								var dimen = [];
								var tam = 1;
								var dims = dim.dims.split(" ");
								for(var i = 0; i < dim.type*2; i+=2){
									dimen[i] = parseInt(dims[i]);
									dimen[i+1] = parseInt(dims[i+1]);
									if (dimen[i] > dimen[i+1] && dimen[i] >=0 && dimen[i+1] >= 0){
										console.log("Error en la linea " + (astNode.line+1) + ": El indice inicial debe ser menor al final en un arreglo, y ambos deben ser enteros positivos");
										return null;
									}
									tam *= (dimen[i+1]-dimen[i]+1);
								}
								if(astNode.tov == 'Integer' || astNode.tov == 'Real' || astNode.tov == 'String' || astNode.tov == 'Char' || astNode.tov == 'Boolean' || astNode.tov in FindScope(astNode.tov, executionstack.size()-1)){
									executionstack.top()[astNode.name] = new AstNode('Array', {of : astNode.tov, array : element, dim : dim.type, dims : dimen, size : tam});
								}else{
									console.log("Error en la linea " + (astNode.line+1) + ": El tipo "+astNode.tov+" no ha sido definido");
									return null;
								}
								console.log(dim.dims+" "+dim.type);
							}else{
								var dimen = [];
								dimen[0] = 0;
								dimen[1] = list.length-1;
								var tam = list.length;
								executionstack.top()[astNode.name] = new AstNode('Array', {of : aux_type, array : list, dim : 1, dims : dimen, size : tam, origin: astNode.name});
								console.log(dimen[0]+" "+dimen[1]+" "+1);
							}
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": La variable "+astNode.name+" ya existe");
							return null;
						}
					break;
					case 'Init':
						list = [];
						v = eval(astNode.left);
					break;
					case 'NextType':
						var lf = eval(astNode.left);
						lf = Value(lf);
						if (aux_type == '')
							aux_type = lf.type;
						if (aux_type == lf.type){
							list.push(lf.value);
							eval(astNode.right);
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": Los arreglos en Alpha deben ser homogeneos, tipo del arreglo ("+aux_type+") tipo encontrado ("+lf.type+")");
							return null;
						}
					break;
					case 'FinalType':
						var lf = eval(astNode.left);
						lf = Value(lf);
						if (aux_type == '')
							aux_type = lf.type;
						if (aux_type == lf.type){
							list.push(lf.value);
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": Los arreglos en Alpha deben ser homogeneos, tipo del arreglo ("+aux_type+") tipo encontrado ("+lf.type+")");
							return null;
						}
					break;
					case 'Dim':
						var lf = eval(astNode.left);
						var init = eval(astNode.init);
						init = Value(init);
						var end = eval(astNode.end);
						end = Value(end);
						v = new AstNode(1+lf.type, {dims : init.value+" "+end.value+" "+lf.dims});
					break;
					case 'Ndim':
						var lf = eval(astNode.left);
						var init = eval(astNode.init);
						init = Value(init);
						var end = eval(astNode.end);
						end = Value(end);
						v = new AstNode(1+lf.type, {dims : init.value+" "+end.value+" "+lf.dims});
					break;
					case 'Endim':
						v = new AstNode(0, {dims : ""});
					break;
					case 'Function':
						if(!(astNode.name in executionstack.top())) {
							list = [];
							eval(astNode.left);
							executionstack.top()[astNode.name] = new AstNode('Function', {chunk: astNode.right, params: list, ret_type : astNode.ret});
							console.log("La accion "+astNode.name+" tiene "+Object.size(executionstack.top()[astNode.name].params)+" parametros");
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": Ya existe el nombre "+astNode.name);
							return null;
						}
					break;
					case 'Return':
						v = Value(eval(astNode.left));
						console.log("Hice return");
					break;
					case 'Void':
						if(!(astNode.name in executionstack.top())) {
							list = [];
							eval(astNode.left);
							executionstack.top()[astNode.name] = new AstNode('Void', {chunk: astNode.right, params: list});
							console.log("La accion "+astNode.name+" tiene "+Object.size(executionstack.top()[astNode.name].params)+" parametros");
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": Ya existe el nombre "+astNode.name);
							return null;
						}
					break;
					case 'Params':
						v = eval(astNode.left);
					break;
					case 'TypeParam':
						if(!(astNode.right in list)) {
							list[astNode.right] = new AstNode(astNode.left);
							eval(astNode.next);
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": Ya existe la variable "+astNode.right);
							return null;
						}
					break;
					case 'Next':
						v = eval(astNode.left);
					break;
					case 'Funcall':
						v = eval(astNode.left);
					break;
					case 'Call':
						var lf = eval(astNode.left);
						if(!(lf.name in FindScope(lf.name, executionstack.size()-1))) {
							console.log("Error en la linea " + (astNode.line+1) + ": No existe la funcion/accion "+lf.name);
							return null;
						}else{
							if (FindScope(lf.name, executionstack.size()-1)[lf.name].type == 'Function' || FindScope(lf.name, executionstack.size()-1)[lf.name].type == 'Void'){
								var func = FindScope(lf.name, executionstack.size()-1)[lf.name];
								var args = eval(astNode.right);
								if (Object.size(func.params) != Object.size(args)){
									console.log("Error en la linea " + (astNode.line+1) + ": La funcion/accion "+lf.name+" tiene mas o menos parametros que la llamada");
									return null;
								}else{
									var newstackframe = {};
									var i = 0;
									var j;
									for(var xkey in args){
										j = 0;
										for (var ykey in func.params){
											if (j < i){
												j++;
											}else{
												if (j == i){
													if (args[xkey].type == func.params[ykey].type){
														newstackframe[ykey] = new AstNode(func.params[ykey].type, {value: args[xkey].value});
													}else{
														if(func.params[ykey].type == 'Integer' && args[xkey].type == 'Real'){
															newstackframe[ykey] = new AstNode(func.params[ykey].type, {value: parseInt(args[xkey].value)});
														}else{
															if(func.params[ykey].type == 'Real' && args[xkey].type == 'Integer'){
																newstackframe[ykey] = new AstNode(func.params[ykey].type, {value: parseFloat(args[xkey].value)});
															}else{
																console.log("Error en la linea " + (astNode.line+1) + ": La variable "+ykey+" no es del tipo "+args[xkey].type);
																return null;		
															}
														}
													}
													j++;
												}else{
													break;
												}
											}
										}
										i++;
									}
									executionstack.push(newstackframe);
									v = eval(func.chunk);
									executionstack.pop();
								}
							}else{
								console.log("Error en la linea " + (astNode.line+1) + ": La variable "+lf.name+" no es del tipo funcion/accion, es "+FindScope(lf.name, executionstack.size()-1)[lf.name].type);
								return null;
							}
						}
					break;
					case 'Print':
						var str = "";
						var pr = eval(astNode.left);
						for (var i = 0; i < pr.length; i++){
							str += pr[i].value;
						}
						console.log(str);
					break;
					case 'Println':
						var str = "";
						var pr = eval(astNode.left);
						for (var i = 0; i < pr.length; i++){
							str += pr[i].value;
						}
						console.log(str+"\n");
					break;
					case 'Read':
						eval(astNode.left);
					break;
					case 'Vars':
						/*var lf = eval(astNode.left);
						if(lf.name in FindScope(lf.name, executionstack.size()-1)) {
							var id = FindScope(lf.name, executionstack.size()-1)[lf.name];
							if(id.type != 'Pointer'){
								var ent = get_entries(1);
								if (!ent){
									console.log("Error en la linea " + (astNode.line+1) + ": No se encontraron mas datos en la etrada");
									return null;
								}
								if (lf.type == 'Var'){
									if (id.type == GetType(ent[0])){
										var value;
										if (ent[0] == 'true') value = true;
										if (ent[0] == 'false') value = false;
										if (id.type == 'Integer') value = parseInt(ent[0]);
										if (id.type == 'Real') value = parseFloat(ent[0]);
										if (id.type == 'Char') value = ent[0][0];
										if (id.type == 'String') value = ent[0];
										FindScope(lf.name, executionstack.size()-1)[lf.name].value = value;
									}else{
										if(id.type == 'Integer' && GetType(ent[0]) == 'Real'){
											FindScope(lf.name, executionstack.size()-1)[lf.name].value = parseInt(ent[0]);
										}else{
											if(id.type == 'Real' && GetType(ent[0]) == 'Integer'){
												FindScope(lf.name, executionstack.size()-1)[lf.name].value = parseFloat(ent[0]);
											}else{
												if (id.type == 'Char' && ent[0].length == 1){
													FindScope(lf.name, executionstack.size()-1)[lf.name].value = ent[0][0];
												}else{
													if (id.type == 'String'){
														FindScope(lf.name, executionstack.size()-1)[lf.name].value = ent[0];
													}else{
														console.log("Error en la linea " + (astNode.line+1) + ": La variable "+lf.name+" no es del tipo "+GetType(ent[0]));
														return null;		
													}
												}		
											}
										}
									}
								}else{
									if (lf.type == 'Array'){
										if(lf.dims == id.dim && FindScope(lf.name, executionstack.size()-1)[lf.name].type == 'Array'){
											var formula = 0;
											var aux = 1;
											var cont = id.dim;
											var ind = lf.ind.split(" ");
											for (var i = 0; i < id.dims.length; i+=2){
												if (!(parseInt(ind[i/2]) >= id.dims[i] && parseInt(ind[i/2]) <= id.dims[i+1])){
													console.log("Error en la linea " + (astNode.line+1) + ": El indice "+ind[i/2]+" no esta dentro de los limites del arreglo ("+id.dims[i]+","+id.dims[i+1]+")");
													return null;
												}
												cont = id.dim-1;
												while (cont > i/2){
													aux = aux*(id.dims[cont*2+1]-id.dims[cont*2]+1);
													cont--; 
												} 
												formula += aux*(parseInt(ind[i/2])-id.dims[i]);
												console.log("formula = "+formula+" "+ind[i/2]+" "+id.dims[i]);
												aux = 1;
											}
											aux_type = id.of;
											if (id.of in FindScope(id.of, executionstack.size()-1)){
												FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula] = FindScope(id.of, executionstack.size()-1)[id.of];
												aux_type = FindScope(id.of, executionstack.size()-1)[id.of].type;
											}
											if(aux_type == 'Register'){
												if (findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).type == GetType(ent[0])){
													var value;
													if (ent[0] == 'true') value = true;
													if (ent[0] == 'false') value = false;
													if (GetType(ent[0]) == 'Integer') value = parseInt(ent[0]);
													if (GetType(ent[0]) == 'Real') value = parseFloat(ent[0]);
													if (GetType(ent[0]) == 'Char') value = ent[0][0];
													if (GetType(ent[0]) == 'String') value = ent[0];
													findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).value = value;
												}else{
													if(findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).type == 'Integer' && GetType(ent[0]) == 'Real'){
														findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).value = parseInt(ent[0]);
													}else{
														if(findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).type == 'Real' && GetType(ent[0]) == 'Integer'){
															findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).value = parseFloat(ent[0]);
														}else{
															if (findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).type == 'Char' && ent[0].length == 1){
																findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).value = ent[0][0];
															}else{
																if (findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).type == 'String'){
																	findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).value = ent[0];
																}else{
																	console.log("Error en la linea " + (astNode.line+1) + ": El campo dentro del registro no es del tipo "+GetType(ent[0]));
																	return null;		
																}
															}		
														}
													}
												}
											}else{
												id.of = aux_type;
												if (id.of == GetType(ent[0])){
													var value;
													if (ent[0] == 'true') value = true;
													if (ent[0] == 'false') value = false;
													if (id.of == 'Integer') value = parseInt(ent[0]);
													if (id.of == 'Real') value = parseFloat(ent[0]);
													if (id.of == 'Char') value = ent[0][0];
													if (id.of == 'String') value = ent[0];
													FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula] = value;
												}else{
													if(id.of == 'Integer' && GetType(ent[0]) == 'Real'){
														FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula] = parseInt(ent[0]);
													}else{
														if(id.of == 'Real' && GetType(ent[0]) == 'Integer'){
															FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula] = parseFloat(ent[0]);
														}else{
															if (id.of == 'Char' && ent[0].length == 1){
																FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula] = ent[0][0];
															}else{
																if (id.of == 'String'){
																	FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula] = ent[0];
																}else{
																	console.log("Error en la linea " + (astNode.line+1) + ": El arreglo "+lf.name+" no es del tipo "+GetType(ent[0]));
																	return null;		
																}
															}		
														}
													}
												}
												console.log(lf.name+"["+formula+"] = "+FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]);
											}
										}else{
											console.log("Error en la linea " + (astNode.line+1) + ": No se ha declarado el arreglo "+lf.name);
											return null;
										}
									}else{
										if (lf.type == 'Register'){
											var temp = findItem(lf.access, FindScope(lf.name, executionstack.size()-1));
											if (temp.type == 'Pointer'){
												console.log("Error en la linea " + (astNode.line+1) + ": No se permite dar valor de entrada a un apuntador");
												return null;
											}else{
												if (temp.type == GetType(ent[0])){
													var value;
													if (ent[0] == 'true') value = true;
													if (ent[0] == 'false') value = false;
													if (temp.type == 'Integer') value = parseInt(ent[0]);
													if (temp.type == 'Real') value = parseFloat(ent[0]);
													if (temp.type == 'Char') value = ent[0][0];
													if (temp.type == 'String') value = ent[0];
													findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).value = value;
												}else{
													if(temp.type == 'Integer' && GetType(ent[0]) == 'Real'){
														findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).value = parseInt(ent[0]);
													}else{
														if(temp.type == 'Real' && GetType(ent[0]) == 'Integer'){
															findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).value = parseFloat(ent[0]);
														}else{
															if (temp.type == 'Char' && ent[0].length == 1){
																findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).value = ent[0][0];
															}else{
																if (temp.type == 'String'){
																	findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).value = ent[0];
																}else{
																	console.log("Error en la linea " + (astNode.line+1) + ": El campo del registro "+lf.name+" no es del tipo "+GetType(ent[0]));
																	return null;		
																}
															}		
														}
													}
												}
											}
											console.log("El valor guardado es "+findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).value);
										}else{
											console.log("Error en la linea " + (astNode.line+1) + ": Solo se pueden dar valores de entrada a variables o arreglos");
											return null;
										}
									}
								}
								eval(astNode.right);
							}else{
								console.log("Error en la linea " + (astNode.line+1) + ": El apuntador "+lf.name+" no puede obtener ningun valor de lectura");
								return null;
							}
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": La variable "+lf.name+" no ha sido declarada");
							return null;
						}*/
					break;
					case 'FinalVars':
						/*var lf = eval(astNode.left);
						if(lf.name in FindScope(lf.name, executionstack.size()-1)) {
							var id = FindScope(lf.name, executionstack.size()-1)[lf.name];
							if(id.type != 'Pointer'){
								var ent = get_entries(1);
								if (!ent){
									console.log("Error en la linea " + (astNode.line+1) + ": No se encontraron mas datos en la etrada");
									return null;
								}
								if (lf.type == 'Var'){
									if (id.type == GetType(ent[0])){
										var value;
										if (ent[0] == 'true') value = true;
										if (ent[0] == 'false') value = false;
										if (id.type == 'Integer') value = parseInt(ent[0]);
										if (id.type == 'Real') value = parseFloat(ent[0]);
										if (id.type == 'Char') value = ent[0][0];
										if (id.type == 'String') value = ent[0];
										FindScope(lf.name, executionstack.size()-1)[lf.name].value = value;
									}else{
										if(id.type == 'Integer' && GetType(ent[0]) == 'Real'){
											FindScope(lf.name, executionstack.size()-1)[lf.name].value = parseInt(ent[0]);
										}else{
											if(id.type == 'Real' && GetType(ent[0]) == 'Integer'){
												FindScope(lf.name, executionstack.size()-1)[lf.name].value = parseFloat(ent[0]);
											}else{
												if (id.type == 'Char' && ent[0].length == 1){
													FindScope(lf.name, executionstack.size()-1)[lf.name].value = ent[0][0];
												}else{
													if (id.type == 'String'){
														FindScope(lf.name, executionstack.size()-1)[lf.name].value = ent[0];
													}else{
														console.log("Error en la linea " + (astNode.line+1) + ": La variable "+lf.name+" no es del tipo "+GetType(ent[0]));
														return null;		
													}
												}		
											}
										}
									}
								}else{
									if (lf.type == 'Array'){
										if(lf.dims == id.dim && FindScope(lf.name, executionstack.size()-1)[lf.name].type == 'Array'){
											var formula = 0;
											var aux = 1;
											var cont = id.dim;
											var ind = lf.ind.split(" ");
											for (var i = 0; i < id.dims.length; i+=2){
												if (!(parseInt(ind[i/2]) >= id.dims[i] && parseInt(ind[i/2]) <= id.dims[i+1])){
													console.log("Error en la linea " + (astNode.line+1) + ": El indice "+ind[i/2]+" no esta dentro de los limites del arreglo ("+id.dims[i]+","+id.dims[i+1]+")");
													return null;
												}
												cont = id.dim-1;
												while (cont > i/2){
													aux = aux*(id.dims[cont*2+1]-id.dims[cont*2]+1);
													cont--; 
												} 
												formula += aux*(parseInt(ind[i/2])-id.dims[i]);
												console.log("formula = "+formula+" "+ind[i/2]+" "+id.dims[i]);
												aux = 1;
											}
											aux_type = id.of;
											if (id.of in FindScope(id.of, executionstack.size()-1)){
												FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula] = FindScope(id.of, executionstack.size()-1)[id.of];
												aux_type = FindScope(id.of, executionstack.size()-1)[id.of].type;
											}
											if(aux_type == 'Register'){
												if (findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).type == GetType(ent[0])){
													var value;
													if (ent[0] == 'true') value = true;
													if (ent[0] == 'false') value = false;
													if (GetType(ent[0]) == 'Integer') value = parseInt(ent[0]);
													if (GetType(ent[0]) == 'Real') value = parseFloat(ent[0]);
													if (GetType(ent[0]) == 'Char') value = ent[0][0];
													if (GetType(ent[0]) == 'String') value = ent[0];
													findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).value = value;
												}else{
													if(findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).type == 'Integer' && GetType(ent[0]) == 'Real'){
														findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).value = parseInt(ent[0]);
													}else{
														if(findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).type == 'Real' && GetType(ent[0]) == 'Integer'){
															findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).value = parseFloat(ent[0]);
														}else{
															if (findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).type == 'Char' && ent[0].length == 1){
																findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).value = ent[0][0];
															}else{
																if (findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).type == 'String'){
																	findItem(lf.access, FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]).value = ent[0];
																}else{
																	console.log("Error en la linea " + (astNode.line+1) + ": El campo dentro del registro no es del tipo "+GetType(ent[0]));
																	return null;		
																}
															}		
														}
													}
												}
											}else{
												id.of = aux_type;
												if (id.of == GetType(ent[0])){
													var value;
													if (ent[0] == 'true') value = true;
													if (ent[0] == 'false') value = false;
													if (id.of == 'Integer') value = parseInt(ent[0]);
													if (id.of == 'Real') value = parseFloat(ent[0]);
													if (id.of == 'Char') value = ent[0][0];
													if (id.of == 'String') value = ent[0];
													FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula] = value;
												}else{
													if(id.of == 'Integer' && GetType(ent[0]) == 'Real'){
														FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula] = parseInt(ent[0]);
													}else{
														if(id.of == 'Real' && GetType(ent[0]) == 'Integer'){
															FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula] = parseFloat(ent[0]);
														}else{
															if (id.of == 'Char' && ent[0].length == 1){
																FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula] = ent[0][0];
															}else{
																if (id.of == 'String'){
																	FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula] = ent[0];
																}else{
																	console.log("Error en la linea " + (astNode.line+1) + ": El arreglo "+lf.name+" no es del tipo "+GetType(ent[0]));
																	return null;		
																}
															}		
														}
													}
												}
												console.log(lf.name+"["+formula+"] = "+FindScope(lf.name, executionstack.size()-1)[lf.name].array[formula]);
											}
										}else{
											console.log("Error en la linea " + (astNode.line+1) + ": No se ha declarado el arreglo "+lf.name);
											return null;
										}
									}else{
										if (lf.type == 'Register'){
											var temp = findItem(lf.access, FindScope(lf.name, executionstack.size()-1));
											if (temp.type == 'Pointer'){
												console.log("Error en la linea " + (astNode.line+1) + ": No se permite dar valor de entrada a un apuntador");
												return null;
											}else{
												if (temp.type == GetType(ent[0])){
													var value;
													if (ent[0] == 'true') value = true;
													if (ent[0] == 'false') value = false;
													if (temp.type == 'Integer') value = parseInt(ent[0]);
													if (temp.type == 'Real') value = parseFloat(ent[0]);
													if (temp.type == 'Char') value = ent[0][0];
													if (temp.type == 'String') value = ent[0];
													findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).value = value;
												}else{
													if(temp.type == 'Integer' && GetType(ent[0]) == 'Real'){
														findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).value = parseInt(ent[0]);
													}else{
														if(temp.type == 'Real' && GetType(ent[0]) == 'Integer'){
															findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).value = parseFloat(ent[0]);
														}else{
															if (temp.type == 'Char' && ent[0].length == 1){
																findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).value = ent[0][0];
															}else{
																if (temp.type == 'String'){
																	findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).value = ent[0];
																}else{
																	console.log("Error en la linea " + (astNode.line+1) + ": El campo del registro "+lf.name+" no es del tipo "+GetType(ent[0]));
																	return null;		
																}
															}		
														}
													}
												}
											}
											console.log("El valor guardado es "+findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).value);
										}else{
											console.log("Error en la linea " + (astNode.line+1) + ": Solo se pueden dar valores de entrada a variables o arreglos");
											return null;
										}
									}
								}
							}else{
								console.log("Error en la linea " + (astNode.line+1) + ": El apuntador "+lf.name+" no puede obtener ningun valor de lectura");
								return null;
							}
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": La variable "+lf.name+" no ha sido declarada");
							return null;
						}*/
					break;
					case 'Args':
						var lf = eval(astNode.left);
						lf = Value(lf);
						v = [];
						v.push(lf);
						var rg = eval(astNode.right);
						for (var key = 0; key < rg.length; key++){
							v.push(rg[key]);
						}
					break;
					case 'FinalArg':
						var lf = eval(astNode.left);
						lf = Value(lf);
						v = [];
						v.push(lf);
					break;
					case 'EmptyCall':
						var lf = eval(astNode.left);
						if(!(lf.name in FindScope(lf.name, executionstack.size()-1))) {
							console.log("Error en la linea " + (astNode.line+1) + ": No existe la funcion/accion "+lf.name);
							return null;
						}else{
							if (FindScope(lf.name, executionstack.size()-1)[lf.name].type == 'Function' || FindScope(lf.name, executionstack.size()-1)[lf.name].type == 'Void'){
								var func = FindScope(lf.name, executionstack.size()-1)[lf.name];
								if (Object.size(func.params) > 0){
									console.log("Error en la linea " + (astNode.line+1) + ": La funcion/accion "+lf.name+" tiene parametros");
									return null;
								}else{
									var newstackframe = {};
									executionstack.push(newstackframe);
									v = eval(func.chunk);
									executionstack.pop();
								}
							}else{
								console.log("Error en la linea " + (astNode.line+1) + ": La variable "+lf.name+" no es del tipo funcion/accion, es "+FindScope(lf.name, executionstack.size()-1)[lf.name].type);
								return null;
							}
						}
					break;
					case 'While':
						var cond = eval(astNode.condition);
						cond = Value(cond);
						if(cond.type == 'Boolean'){
							var stop = false;
							while(cond.value && !stop){

								var newstackframe = {};
								executionstack.push(newstackframe);
								v = eval(astNode.left);
								executionstack.pop();

								if(v)
									stop = true;

								cond = eval(astNode.condition);
								cond = Value(cond);
							}
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": Se requiere del tipo Boolean para evaluar una condicion, y no "+cond.type);
							return null;
						}
					break;
					case 'Do':
						var cond = eval(astNode.condition);
						cond = Value(cond);
						if(cond.type == 'Boolean'){
							var stop = false;
							do{

								var newstackframe = {};
								executionstack.push(newstackframe);
								v = eval(astNode.left);
								executionstack.pop();
								if (v)
									stop = true;

								cond = eval(astNode.condition);
								cond = Value(cond);
							}while(cond.value && !stop);
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": Se requiere del tipo Boolean para evaluar una condicion, y no "+cond.type);
							return null;
						}
					break;
					case 'Select': 
						 v = eval(astNode.left);
					break;
					case 'Cond':
						var cond = eval(astNode.condition);
						cond = Value(cond);
						if(cond.type == 'Boolean'){
							if(cond.value){
								var newstackframe = {};
								executionstack.push(newstackframe);
								v = eval(astNode.left);
								executionstack.pop();
							}else{
								v = eval(astNode.right);
							}
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": Se requiere del tipo Boolean para evaluar un Select, y no "+cond.type);
							return null;
						}
					break;
					case 'For':
						var lf = eval(astNode.id);
						if(lf.name in FindScope(lf.name, executionstack.size()-1)) {
							var id = FindScope(lf.name, executionstack.size()-1)[lf.name];
							var rg = eval(astNode.init); 
							rg = Value(rg);
							var end = eval(astNode.end);
							var inc = eval(astNode.inc);
							end = Value(end);
							inc = Value(inc);
							if (id.type == rg.type && id.type == inc.type && id.type == end.type && id.type == 'Integer' ){
								var stop = false;
								FindScope(lf.name, executionstack.size()-1)[lf.name].value = rg.value;
								while (FindScope(lf.name, executionstack.size()-1)[lf.name].value != end.value && !stop){

									var newstackframe = {};
									executionstack.push(newstackframe);
									v = eval(astNode.left);
									executionstack.pop();

									if (v)
										stop = true;

									FindScope(lf.name, executionstack.size()-1)[lf.name].value += inc.value;
								}
							}else{
								console.log("Error en la linea " + (astNode.line+1) + ": Error de tipos "+id.type+" "+rg.type+" "+inc.type);
								return null;
							}
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": La variable "+lf.name+" no existe");
							return null;
						}
					break;
					case 'Foreach':
						if(!(astNode.element in FindScope(astNode.element, executionstack.size()-1))) {
							if(!(astNode.array in FindScope(astNode.array, executionstack.size()-1))) {
								console.log("Error en la linea " + (astNode.line+1) + ": El arreglo "+astNode.array+" no ha sido declarado");
								return null;
							}else{
								var arr = FindScope(astNode.array, executionstack.size()-1)[astNode.array];
								if (arr.type == 'Array'){
									var stop = false;
									for (var i = 0; i < arr.size && !stop; i++){
										if (arr.of in FindScope(arr.of, executionstack.size()-1)){
											executionstack.top()[astNode.element] = FindType(arr.of);
										}else{
											executionstack.top()[astNode.element] = new AstNode(FindScope(astNode.array, executionstack.size()-1)[astNode.array].of, {value: FindScope(astNode.array, executionstack.size()-1)[astNode.array].array[i]});
										}

										var newstackframe = {};
										executionstack.push(newstackframe);
										v = eval(astNode.left);
										executionstack.pop();
										if(v)
											stop = true;

										if (arr.of in FindScope(arr.of, executionstack.size()-1)){
											FindScope(astNode.array, executionstack.size()-1)[astNode.array].array[i] = executionstack.top()[astNode.element];
										}else{
											FindScope(astNode.array, executionstack.size()-1)[astNode.array].array[i] = executionstack.top()[astNode.element].value;
										}

										console.log("El valor es "+FindScope(astNode.array, executionstack.size()-1)[astNode.array].array[i]);
									}
									delete executionstack.top()[astNode.element];
								}else{
									console.log("Error en la linea " + (astNode.line+1) + ": La variable "+astNode.array+" no es de tipo arreglo, es de tipo "+FindScope(astNode.array, executionstack.size()-1)[astNode.array].type);
									return null;
								}
							}
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": La variable "+astNode.element+" ya existe");
							return null;
						}
					break;
					case 'If':
						var cond = eval(astNode.condition);
						cond = Value(cond);
						if(cond.type == 'Boolean'){
							if(cond.value){
								var newstackframe = {};
								executionstack.push(newstackframe);
								v = eval(astNode.left);
								executionstack.pop();
							}else{
								v = eval(astNode.right);
							}
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": Se requiere del tipo Boolean para evaluar un If, y no "+cond.type);
							return null;
						}
					break;
					case 'Else':
						var newstackframe = {};
						executionstack.push(newstackframe);
						v = eval(astNode.left);
						executionstack.pop();
					break;
					case 'Elseif':
						var cond = eval(astNode.condition);
						cond = Value(cond);
						if(cond.type == 'Boolean'){
							if(cond.value){
								var newstackframe = {};
								executionstack.push(newstackframe);
								v = eval(astNode.left);
								executionstack.pop();
							}
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": Se requiere del tipo Boolean para evaluar un If, y no "+cond.type);
							return null;
						}
					break;
					case 'Asignation': 
						v = eval(astNode.left); 
					break;
					case 'Mod': 
						v = eval(astNode.left); 
					break;
					case 'Powerop': 
						v = eval(astNode.left); 
					break;
					case 'Divop': 
						v = eval(astNode.left); 
					break;
					case 'Multop': 
						v = eval(astNode.left); 
					break;
					case 'Minusop': 
						v = eval(astNode.left); 
					break;
					case 'Plusop': 
						v = eval(astNode.left); 
					break;
					case '==': 
						var lf = eval(astNode.left);
						var rg = eval(astNode.right);
						if (lf.type == 'Pointer'){
							if(!(rg.name in FindScope(rg.name, executionstack.size()-1))) {
								console.log("Error en la linea " + (astNode.line+1) + ": La variable "+rg.name+" no existe");
								return null;
							}else{
								if (rg.type == 'Register'){
									v = new AstNode('Boolean', {value : null == findItem(rg.access, FindScope(rg.name, executionstack.size()-1)).dir});
								}else{
									v = new AstNode('Boolean', {value : null == FindScope(rg.name, executionstack.size()-1)[rg.name].dir});
								}

							}
						}else{
							if (rg.type == 'Pointer'){
								if(!(lf.name in FindScope(lf.name, executionstack.size()-1))) {
									console.log("Error en la linea " + (astNode.line+1) + ": La variable "+lf.name+" no existe");
									return null;
								}else{
									if (lf.type == 'Register'){
										v = new AstNode('Boolean', {value : null == findItem(lf.access, FindScope(lf.name, executionstack.size()-1)).dir});
									}else{
										v = new AstNode('Boolean', {value : null == FindScope(lf.name, executionstack.size()-1)[lf.name].dir});
									}

								}
							}else{
								lf = Value(lf);
								rg = Value(rg);
								if(lf.type == rg.type){
									v = new AstNode('Boolean', {value : lf.value == rg.value});
									console.log("resultado = "+v.value);
								}else{
									console.log("Error en la linea " + (astNode.line+1) + ": No se puede comparar "+lf.type+" con "+rg.type);
									return null;
								}
							}
						}
					break;
					case '<=': 
						var lf = eval(astNode.left);
						var rg = eval(astNode.right);
						lf = Value(lf);
						rg = Value(rg);
						if(lf.type == rg.type){
							v = new AstNode('Boolean', {value : lf.value <= rg.value});
							console.log("resultado = "+v.value);
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": No se puede comparar "+lf.type+" con "+rg.type);
							return null;
						}
					break;
					case '>=': 
						var lf = eval(astNode.left);
						var rg = eval(astNode.right);
						lf = Value(lf);
						rg = Value(rg);
						if(lf.type == rg.type){
							v = new AstNode('Boolean', {value : lf.value >= rg.value});
							console.log("resultado = "+v.value);
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": No se puede comparar "+lf.type+" con "+rg.type);
							return null;
						}
					break;
					case '<': 
						var lf = eval(astNode.left);
						var rg = eval(astNode.right);
						lf = Value(lf);
						rg = Value(rg);
						if(lf.type == rg.type){
							v = new AstNode('Boolean', {value : lf.value < rg.value});
							console.log("resultado = "+v.value);
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": No se puede comparar "+lf.type+" con "+rg.type);
							return null;
						}
					break;
					case '>': 
						var lf = eval(astNode.left);
						var rg = eval(astNode.right);
						lf = Value(lf);
						rg = Value(rg);
						if(lf.type == rg.type){
							v = new AstNode('Boolean', {value : lf.value > rg.value});
							console.log("resultado = "+v.value);
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": No se puede comparar "+lf.type+" con "+rg.type);
							return null;
						}
					break;
					case '!=': 
						var lf = eval(astNode.left);
						var rg = eval(astNode.right);
						lf = Value(lf);
						rg = Value(rg);
						if(lf.type == rg.type){
							v = new AstNode('Boolean', {value : lf.value != rg.value});
							console.log("resultado = "+v.value);
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": No se puede comparar "+lf.type+" con "+rg.type);
							return null;
						}
					break;
					case 'or': 
						var lf = eval(astNode.left);
						var rg = eval(astNode.right);
						lf = Value(lf);
						rg = Value(rg);
						if(lf.type == rg.type && rg.type == 'Boolean'){
							v = new AstNode('Boolean', {value : lf.value || rg.value});
							console.log("resultado = "+v.value);
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": No se puede comparar "+lf.type+" con "+rg.type);
							return null;
						}
					break;
					case 'not': 
						var lf = eval(astNode.left);
						lf = Value(lf);
						if(lf.type == 'Boolean'){
							v = new AstNode('Boolean', {value : !lf.value});
							console.log("resultado = "+v.value);
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": No se puede negar el tipo "+lf.type);
							return null;
						}
					break;
					case 'and': 
						var lf = eval(astNode.left);
						var rg = eval(astNode.right);
						lf = Value(lf);
						rg = Value(rg);
						if(lf.type == rg.type && rg.type == 'Boolean'){
							v = new AstNode('Boolean', {value : lf.value && rg.value});
							console.log("resultado = "+v.value);
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": No se puede comparar "+lf.type+" con "+rg.type);
							return null;
						}
					break;
					case '+': 
						var lf = eval(astNode.left);
						var rg = eval(astNode.right);
						lf = Value(lf);
						rg = Value(rg);
						if((lf.type == rg.type || (lf.type == 'Integer' && rg.type == 'Real') || (lf.type == 'Real' && rg.type == 'Integer')) && (lf.type == 'Integer' || lf.type == 'Real')){
							if (lf.type == 'Real' || rg.type == 'Real'){
								v = new AstNode('Real', {value : lf.value + rg.value});
							}else{
								v = new AstNode('Integer', {value : lf.value + rg.value});
							}
							console.log("resultado = "+v.value);
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": No se puede operar "+lf.type+" con "+rg.type);
							return null;
						}
					break;
					case '%': 
						var lf = eval(astNode.left);
						var rg = eval(astNode.right);
						lf = Value(lf);
						rg = Value(rg);
						if((lf.type == rg.type || (lf.type == 'Integer' && rg.type == 'Real') || (lf.type == 'Real' && rg.type == 'Integer')) && (lf.type == 'Integer' || lf.type == 'Real')){
							if (lf.type == 'Real' || rg.type == 'Real'){
								v = new AstNode('Real', {value : lf.value % rg.value});
							}else{
								v = new AstNode('Integer', {value : lf.value % rg.value});
							}
							console.log("resultado = "+v.value);
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": No se puede operar "+lf.type+" con "+rg.type);
							return null;
						}
					break;
					case '^': 
						var lf = eval(astNode.left);
						var rg = eval(astNode.right);
						lf = Value(lf);
						rg = Value(rg);
						if((lf.type == rg.type || (lf.type == 'Integer' && rg.type == 'Real') || (lf.type == 'Real' && rg.type == 'Integer')) && (lf.type == 'Integer' || lf.type == 'Real')){
							if (lf.type == 'Real' || rg.type == 'Real'){
								v = new AstNode('Real', {value : Math.pow(lf.value, rg.value)});
							}else{
								v = new AstNode('Integer', {value : Math.pow(lf.value, rg.value)});
							}
							console.log("resultado = "+v.value);
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": No se puede operar "+lf.type+" con "+rg.type);
							return null;
						}
					break;
					case '-': 
						var lf = eval(astNode.left);
						var rg = eval(astNode.right);
						lf = Value(lf);
						rg = Value(rg);
						if((lf.type == rg.type || (lf.type == 'Integer' && rg.type == 'Real') || (lf.type == 'Real' && rg.type == 'Integer')) && (lf.type == 'Integer' || lf.type == 'Real')){
							if (lf.type == 'Real' || rg.type == 'Real'){
								v = new AstNode('Real', {value : lf.value - rg.value});
							}else{
								v = new AstNode('Integer', {value : lf.value - rg.value});
							}
							console.log("resultado = "+v.value);
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": No se puede operar "+lf.type+" con "+rg.type);
							return null;
						}
					break;
					case '*': 
						var lf = eval(astNode.left);
						var rg = eval(astNode.right);
						lf = Value(lf);
						rg = Value(rg);
						if((lf.type == rg.type || (lf.type == 'Integer' && rg.type == 'Real') || (lf.type == 'Real' && rg.type == 'Integer')) && (lf.type == 'Integer' || lf.type == 'Real')){
							if (lf.type == 'Real' || rg.type == 'Real'){
								v = new AstNode('Real', {value : lf.value * rg.value});
							}else{
								v = new AstNode('Integer', {value : lf.value * rg.value});
							}
							console.log("resultado = "+v.value);
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": No se puede operar "+lf.type+" con "+rg.type);
							return null;
						}
					break;
					case '/': 
						var lf = eval(astNode.left);
						var rg = eval(astNode.right);
						lf = Value(lf);
						rg = Value(rg);
						if((lf.type == rg.type || (lf.type == 'Integer' && rg.type == 'Real') || (lf.type == 'Real' && rg.type == 'Integer')) && (lf.type == 'Integer' || lf.type == 'Real')){
							if (lf.type == 'Real' || rg.type == 'Real'){
								v = new AstNode('Real', {value : lf.value / rg.value});
							}else{
								v = new AstNode('Integer', {value : lf.value / rg.value});
							}
							console.log("resultado = "+v.value);
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": No se puede operar "+lf.type+" con "+rg.type);
							return null;
						}
					break;
					case 'Lessop': 
						v = eval(astNode.left);
						//console.log("1");
					break;
					case 'Equalop': 
						v = eval(astNode.left);
						//console.log("2"); 
					break;
					case 'Greaterop': 
						v = eval(astNode.left);
						//console.log("3"); 
					break;
					case 'Notequalop': 
						v = eval(astNode.left);
						//console.log("4"); 
					break;
					case 'Andop': 
						v = eval(astNode.left);
						//console.log("5"); 
					break;
					case 'Not': 
						v = eval(astNode.left);
						//console.log("6"); 
					break;
					case 'Meop': 
						v = eval(astNode.left);
						//console.log("7"); 
					break;
					case 'Geop': 
						v = eval(astNode.left);
						//console.log("8"); 
					break;
					case 'Backtrack': 
						v = eval(astNode.left);
						//console.log("9"); 
					break;
					case 'Exp': 
						v = eval(astNode.left);
						//console.log("10"); 
					break;
					case 'Class': 
						v = eval(astNode.left);
						//console.log("11"); 
					break;
					case 'Pointer':
					var lf = eval(astNode.left);
						if(!(lf.name in FindScope(lf.name, executionstack.size()-1)) || FindScope(lf.name, executionstack.size()-1)[lf.name].type != 'Pointer') {
							console.log("Error en la linea " + (astNode.line+1) + ": El apuntador "+lf.name+" no ha sido declarado");
							return null;
						}else{
							lf.name = FindScope(lf.name, executionstack.size()-1)[lf.name].name;
							if (lf.type == 'Register'){
								var i = 0;
								while(lf.access[i] != '.')
									i++;
								lf.access = lf.name + lf.access.substr(i, lf.access.length-1);
							}
							v = lf;
						}
					break;
					case 'Object':
						if(!(astNode.name in FindScope(astNode.name, executionstack.size()-1))) {
							console.log("Error en la linea " + (astNode.line+1) + ": El objeto "+astNode.name+" no ha sido declarado");
							return null;
						}else{
							v = new AstNode('Register', { name : astNode.name, access: astNode.name+"."+eval(astNode.left), line : astNode.line});
						}
					break;
					case 'FinalVar':
						v = astNode.name;
					break;
					case 'NextVar':
						v = astNode.name+"."+eval(astNode.left);
					break;
					case 'Complex Array':
						if(astNode.name in FindScope(astNode.name, executionstack.size()-1)) {
							var lf = eval(astNode.left);
							var index = eval(astNode.index);
							index = Value(index);
							if (index.type != 'Integer'){
								console.log("Error en la linea " + (astNode.line+1) + ": El indice de un arreglo debe ser un entero");
								return null;
							}
							if (index.value < 0){
								console.log("Error en la linea " + (astNode.line+1) + ": El indice de un arreglo no puede ser negativo");
								return null;
							}
							v = new AstNode('Array', {ind : index.value+" "+lf.ind, dims : 1 + lf.dims, name : astNode.name, access: eval(astNode.right), line : astNode.line});
							console.log("los indices son "+index.value+" "+lf.ind+" "+(lf.dims+1));
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": No se ha declarado el arreglo "+astNode.name);
							return null;
						}
					break;
					case 'INT': 
						v = new AstNode('Integer', {value : astNode.value});
					break;
					case 'REAL': 
						v = new AstNode('Real', {value : astNode.value});
					break;
					case 'STRING': 
						v = new AstNode('String', {value : astNode.value.substr(1, astNode.value.length-2)}); 
					break;
					case 'BOOL': 
						if (astNode.value == 'true'){
							v = new AstNode('Boolean', {value : true});
						}else{
							v = new AstNode('Boolean', {value : false});
						}
					break;
					case 'POINTER': 
						v = new AstNode('Pointer', {value : astNode.value});
					break;
					case 'VAR': 
						v = new AstNode('Var', {name : astNode.name, line : astNode.line});
					break;
					case 'CHAR': 
						v = new AstNode('Char', {value : astNode.value.substr(1, astNode.value.length-2)});
					break;
					case 'ARRAY': 
						if(astNode.name in FindScope(astNode.name, executionstack.size()-1)) {
							var lf = eval(astNode.left);
							var index = eval(astNode.index);
							index = Value(index);
							if (index.type != 'Integer'){
								console.log("Error en la linea " + (astNode.line+1) + ": El indice de un arreglo debe ser un entero");
								return null;
							}
							if (index.value < 0){
								console.log("Error en la linea " + (astNode.line+1) + ": El indice de un arreglo no puede ser negativo");
								return null;
							}
							v = new AstNode('Array', {ind : index.value+" "+lf.ind, dims : 1 + lf.dims, name : astNode.name, line : astNode.line});
							console.log("los indices son "+index.value+" "+lf.ind+" "+(lf.dims+1));
						}else{
							console.log("Error en la linea " + (astNode.line+1) + ": No se ha declarado el arreglo "+astNode.name);
							return null;
						} 
					break;
					case 'ARR':
						var lf = eval(astNode.left);
						var index = eval(astNode.index);
						index = Value(index);
						if (index.type != 'Integer'){
							console.log("Error en la linea " + (astNode.line+1) + ": El indice de un arreglo debe ser un entero");
							return null;
						}
						if (index.value < 0){
							console.log("Error en la linea " + (astNode.line+1) + ": El indice de un arreglo no puede ser negativo");
							return null;
						}
						v = new AstNode('Array', {ind : index.value+" "+lf.ind, dims : 1 + lf.dims, line : astNode.line});
					break;
					case 'EndARR':
						v = new AstNode('Array', {ind : "", dims : 0});
					break;
					case 'Empty':
					break;
				}
				return v;
			}

			var executionstack = new DataStructures.stack();
			executionstack.push({});

module.exports = {
	eval,
	Emitter
};