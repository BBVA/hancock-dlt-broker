nodePipeline{

  // ---- DEVELOP ---- 
  if (env.BRANCH_NAME == 'develop') {

    docker_shuttle_stage()

    qa_data_shuttle_stage()

    deploy_shuttle_stage(project: "blockchainhub", environment: "develop")
    
  }

}