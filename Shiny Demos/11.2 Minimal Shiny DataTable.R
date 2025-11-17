#### Minimal R Shiny example Data Table####
#### Novermber 2020 ####

library(shiny)
library(dplyr)
library(data.table)

ui = fluidPage(
  titlePanel("Minimal example: R Shiny with data table"),  
  
  sidebarLayout(   
    sidebarPanel(h4("Sidebar content") # h4 specifies format as a fourth-level heading
      ),
    
    mainPanel(h4("Main panel content"),
              dataTableOutput("car_table")
              )
  ))
  
server = function(input, output) {   
    output$car_table<- renderDataTable({
      mtcars
      }, options = list(pageLength = 10)
    )
  }

shinyApp(ui = ui, server = server)
