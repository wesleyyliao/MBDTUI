import React from 'react';
import {Link} from 'react-router';
import {getMacrosAllTablesDelete, requestDeleteMacroExecution} from '../server.js';
import { getUsername, getGroup } from '../credentials.js'

export default class Delete extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      selected_table: '',
      selected_macro: '',
      emergency_check: false,
      macros_all_tables: null,
      request_info: null,
      result_message: null
    };
    this.sendUpdate = this.sendUpdate.bind(this);
    this.handleTableSelected = this.handleTableSelected.bind(this);
    this.handleMacroSelected = this.handleMacroSelected.bind(this);
    this.handleParameterChanged = this.handleParameterChanged.bind(this);
    this.handleCheckboxClicked = this.handleCheckboxClicked.bind(this);
    this.handleConfirmation = this.handleConfirmation.bind(this);
    this.handleReadResult = this.handleReadResult.bind(this);
  }

  componentDidMount(){
    console.log('Component Mounted');
    getMacrosAllTablesDelete((macros_all_tables) => {
      // console.log(JSON.stringify(macros_all_tables));
      var tableName = Object.getOwnPropertyNames(macros_all_tables)[0];
      var macro = Object.getOwnPropertyNames(macros_all_tables[tableName])[0];
      this.setState({
        macros_all_tables: macros_all_tables,
        selected_table: tableName,
        selected_macro: macro
      });
    })
  }
  handleTableSelected(event){
    event.preventDefault();
    var table_name = event.target.value;
    console.log('Called');
    this.setState({
      selected_table: table_name,
      selected_macro: Object.getOwnPropertyNames(this.state.macros_all_tables[table_name])[0]
    });
  }
  handleMacroSelected(event){
    event.preventDefault();
    var macro_name = event.target.value;
    this.setState({
      selected_macro: macro_name
    })
  }
  handleParameterChanged(event) {
    event.preventDefault();
    // console.log(JSON.stringify(event));
    var param_value = event.target.value;
    var param_name = event.target.id;
    this.state.macros_all_tables[this.state.selected_table][this.state.selected_macro][param_name] = param_value;
    // this.state. = param_value;
    // console.log(this.state.macros_all_tables.update[this.state.selected_table][this.state.selected_macro][param_name]);
  }
  handleCheckboxClicked() {
    this.setState({
      emergency_check: !this.state.emergency_check
    });
  }

  sendUpdate(){
    var user = getUsername();
    var group = getGroup();
    var request_type;
    if(this.state.emergency_check) {
      request_type = 'emergency';
    } else {
      request_type = 'peer_review';
    }
    var proposed_macro = {
      macroType: "Delete",
      request_type: request_type,
      table: this.state.selected_table,
      function_called: this.state.selected_macro,
      params: this.state.macros_all_tables[this.state.selected_table][this.state.selected_macro],
      user: user,
      group: group
    };
    console.log(JSON.stringify(proposed_macro));
    requestDeleteMacroExecution(request_type, proposed_macro, (result) => {
      if(result.status == 'error'){
        console.log(JSON.stringify(result.error));
        this.setState({
          result_message: {
            type:'error',
            msg: 'Your requested macro has failed to execute! Check your input data!'
          }
        });
      }
      else if(result.status == 'success'){
        console.log(JSON.stringify(result.result));
        this.setState({
          result_message: {
            type:'success',
            msg: 'Your requested macro has executed successfullly!'
          }
        })
      }
      else{
        this.setState({
          result_message: {
            type:'wait',
            msg: 'Your requested macro has been sent to your peers for reviewing!'
          }
        })
      }
    });
  }

  handleConfirmation(){
    var params = this.state.macros_all_tables[this.state.selected_table][this.state.selected_macro];
    var parameterNames = Object.getOwnPropertyNames(params);
    var hasEmptyParam = false;
    parameterNames.forEach((paramName, i) => {
      if(params[paramName] == '') {
        hasEmptyParam = true;
      }
    });
    if(hasEmptyParam) {
      alert('There are some params that are empty!');
    }
    else {
      var request_type;
        if(this.state.emergency_check) {
          request_type = 'emergency';
        } else {
          request_type = 'peer_review';
        }
        var proposed_macro = {
          request_type: request_type,
          table: this.state.selected_table,
          function_called: this.state.selected_macro,
          params: this.state.macros_all_tables[this.state.selected_table][this.state.selected_macro]
        };
        this.setState({
          request_info: proposed_macro
        });
      $("#myMyDelete").modal('toggle');
    }
  }

  addMacroDetails(obj){
    var keys = Object.keys(obj);
    var parameterNames = Object.getOwnPropertyNames(obj);
    var message = parameterNames.map((eachParam, i) => {
      var param = eachParam;
      var value = obj[eachParam];
      return <div className="row" key={i}><div className="col-xs-1"/><div className="col-xs-11"><p><strong>{param}</strong>: {value}</p><br/></div></div>
    });
    return <div>{message}</div>;
  }

  handleReadResult(){
    this.setState({
      result_message: null
    });
  }

  render(){
    var tables = [];
    var available_macros = [];
    var parameters = [];
    if (this.state.macros_all_tables !== null) {
      var tableNames = Object.getOwnPropertyNames(this.state.macros_all_tables);
      tables = tableNames.map((eachTableName, i) => {
        return <option key={i} value={eachTableName}>{eachTableName}</option>
      });
      if (this.state.selected_table !== '') {
        var macroNames = Object.getOwnPropertyNames(this.state.macros_all_tables[this.state.selected_table]);
        available_macros = macroNames.map((eachMacro, i)=>{
          return <option key={i} value={eachMacro}>{eachMacro}</option>
        });
        if (this.state.selected_macro !== '') {
          var parameterNames = Object.getOwnPropertyNames(this.state.macros_all_tables[this.state.selected_table][this.state.selected_macro]);
          parameters = parameterNames.map((eachParameter, i) => {
            return <input key={i} id={eachParameter} className="param-input" onChange={this.handleParameterChanged} type="text" name="by-two" className="form-control" placeholder={eachParameter} aria-describedby="basic-addon1" />
          });
        }
      }
    };
    var execution_result = "No message";
    if(this.state.result_message !== null) {
      var result = this.state.result_message;
      if(result.type == 'error') {
        execution_result = <div className="alert alert-danger" role="alert"><img className="gordon" src="./img/gordon.jpg" height="40px" width="40px"/>{result.msg}</div>
      }
      else if(result.type == 'success') {
        execution_result = <div className="alert alert-success" role="alert"><img className="gordon" src="./img/gordon.jpg" height="40px" width="40px"/>{result.msg}</div>
      }
      else {
        execution_result = <div className="alert alert-info" role="alert"><img className="gordon" src="./img/gordon.jpg" height="40px" width="40px"/>{result.msg}</div>
      }
      $("#execution-result").modal("show");
    }

        // <button type="button" className="btn btn-primary btn-lg" data-toggle="modal" data-target="#execution-result">Launch demo modal</button>
    return(
      <div id="wrapper">
        <div className="modal fade" id="execution-result" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 className="modal-title" id="myModalLabel">MACRO EXECUTION RESULT</h4>
              </div>
              <div className="modal-body">
                {execution_result}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" data-dismiss="modal" onClick={this.handleReadResult}>Close</button>
              </div>
            </div>
          </div>
        </div>
        <div id="page-content-wrapper">
          <div className="container-fluid">
            <div className="row">
              <div className= "col-lg-3"></div>
              <div className= "col-lg-6">
                <div className="input-group">
                  <center>
                    <form action="" method="post" id="update-form">
                      <h3> Table: </h3>
                      <select name="table" value={this.state.table} onChange={this.handleTableSelected} className="selectpicker options btn btn-default" data-width="75%" title="Select a table">
                        {tables}
                      </select>
                      <h3> Delete: </h3>
                      <select name="update" value={this.state.macro} onChange={this.handleMacroSelected} className="selectpicker options btn btn-default" data-width="75%" title="Select a Run Name">
                        {available_macros}
                      </select>
                      <h3> Parameters: </h3>
                      <div id="parameters" className="input-group">
                        {parameters}
                      </div>
                      <div className="col-lg-12">
                        <center><p>Note: This change will be peer reviewed before executed. To bypass peer review check the box below. </p>
                        <input type="checkbox" checked={this.state.emergency_check} name="bypass-peer-review" value="Bypass Peer Review" onChange={this.handleCheckboxClicked}/>
                      </center>
                    </div>
                    <div className="col-lg-12">
                      <div className="bs-example">
                        <button type="button" onClick={this.handleConfirmation} className="btn btn-secondary btn-lg go-btn">Go</button>
                        <div id="myMyDelete" className="modal fade">
                          <div className="modal-dialog" role="document">
                            <div className="modal-content">
                              <div className="modal-header">
                                <button type="button" className="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                                <h4 className="modal-title"><b>CONFIRMATION</b></h4>
                              </div>
                              <div className="modal-body">
                                <h3>Are you sure you want to perform a deletion with the following information?</h3>
                                <p><strong>Table</strong>: {this.state.selected_table}</p>
                                <p><strong>Marco:</strong> {this.state.selected_macro}</p>
                                <p id="ModalPopup"><strong>Parameters: </strong></p><br/>
                                {this.state.request_info===null?'':this.addMacroDetails(this.state.request_info.params)}
                                {this.state.emergency_check?<div className="alert alert-danger" role="alert"><center><h1>EMERGENCY</h1></center></div>: <div className="alert alert-info peer-revision" role="alert">This change will be peer reviewed</div>}
                              </div>
                              <div className="modal-footer">
                                <button type="button" id="yes-btn" onClick={this.sendUpdate} className="btn btn-default" data-dismiss="modal">Yes</button>
                                <button type="button" className="btn btn-default" aria-hidden="true" data-dismiss="modal">No</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </center>
              </div>
            </div>
            <div className= "col-lg-3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
}
