def lint() {
  stage('Linter'){
    container('node'){
      sh """
        yarn global add tslint typescript
        yarn run lint
      """
    }
  }
}

def docs() {
  stage('Docs'){
    container('node'){
      sh "yarn run docs"
      upload_doc_shuttle_stage(docName: "docs", docPath: "./documentation")
    }
  }
}


nodePipeline{

  // ---- DEVELOP ----
  if (env.BRANCH_NAME == 'develop') {
  
    sonar_shuttle_stage()
    
    lint()

    node_unit_tests_shuttle_stage(sh: """yarn cache clean --force
                                        yarn install
                                        yarn run coverage
                                    """)
    
    docs()

    docker_shuttle_stage()

    qa_data_shuttle_stage()

    deploy_shuttle_stage(project: "hancock", environment: "develop", askForConfirmation: false)

  }

  // ---- RELEASE ----
  if (env.BRANCH_NAME =~ 'release/*') {
   
    node_unit_tests_shuttle_stage(sh: """yarn cache clean --force
                                        yarn install
                                        yarn run coverage
                                    """)

    sonar_shuttle_stage()

                                    
    lint()
    
    docs()

    docker_shuttle_stage()
    
    
    deploy_shuttle_stage(project: "hancock", environment: "qa", askForConfirmation: false)

    qa_data_shuttle_stage()

    set2rc_shuttle_stage()
    
    test_from_rc_shuttle_stage() 
    
    create_release_from_RC()
    
    logic_label_shuttle_stage(release: env.BUILD_DISPLAY_NAME)
  }

}
