
#### Minimal R Shiny example ####
#### Novermber 2020 ####
library(shiny)
library(ggplot2)
library(dplyr)


#### Define user interface (ui) ####
ui = shinyUI(fluidPage(
  titlePanel("Minimal R Shiny Example"),  
  
  sidebarLayout(   
        sidebarPanel(
          selectInput("feature", "Vehicle feature:", 
                      choices = colnames(mtcars %>% select(-mpg)))
        ),
        
  mainPanel(
          plotOutput("scatterPlot")
          )
    )
  ))


#### Define server ####
server = function(input, output) {
  output$scatterPlot = renderPlot({
    ggplot(mtcars, aes_string(input$feature, "mpg")) + #Need to use aes_string to pass selected string
      geom_point()   
  })
}


#### Run application ####
shinyApp(ui = ui, server = server)
