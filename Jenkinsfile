nodePipeline{

  // TODO: Activate when it works
  // sonar_shuttle_stage(source: ".", exclusions: "tests/**,raml/**,node_modules/**")

  // stage('unit-test'){
  //   container('node'){
  //     // sh "make test"
  //     sh "yarn run test"
  //   }
  // }

  docker_shuttle_stage()
  
  qa_data_shuttle_stage()

  deploy_shuttle_stage()
  
  // set2rc_shuttle_stage()

}
