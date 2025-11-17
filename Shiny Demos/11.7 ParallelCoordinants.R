# This is a Shiny web application. You can run the application by clicking
# the 'Run App' button above.
# Find out more about building applications with Shiny here:
#    http://shiny.rstudio.com/

#### Load packages and process data
library(shiny)
library(tidyverse)
library(ggrepel)
library(DT)

## Load libraries, load data, and transform data outside the reactive elements
mtcars.df = mtcars
mtcars.df = rownames_to_column(mtcars.df, var = "name")
l.mtcars.df = mtcars.df %>% gather(key = feature, value = value, -name)
l.mtcars.df = l.mtcars.df %>% group_by(feature) %>% mutate(s.value = scale(value)) %>% ungroup()


#### Define UI for application
ui <- fluidPage(
   # Application title
   titlePanel("Interactive parallel coordinate plot for mtcars data"),
   
   sidebarLayout(
     sidebarPanel(p("Each line represents a car. Brush data to higlight a car or several cars.")),
    
   mainPanel(
        plotOutput(outputId = "PC_plot", width = "100%", height = "500px", brush = "plot_brush"),
        dataTableOutput(outputId = "SelectedCars")
      )
   )
)


#### Calculate reactive data and create graphs and tables
server <- function(input, output) {
  
  output$PC_plot = renderPlot({
    ggplot(l.mtcars.df, aes(feature, s.value, group = name)) +
      geom_line(alpha = 0.3) +
      geom_line(data = semi_join(l.mtcars.df, brushedPoints(l.mtcars.df, input$plot_brush), by = "name"), 
                size = .85, colour = "blue") +
      geom_text_repel(
        data =  semi_join(l.mtcars.df, brushedPoints(l.mtcars.df, input$plot_brush), by = "name") %>% 
          filter(feature == "wt"),
                      aes(feature, s.value, label = name)) +
      theme_bw() +
      labs(y = "Scaled value of car feature (z-score)")
  })
  
output$SelectedCars =  renderDataTable(
    semi_join(mtcars.df, brushedPoints(l.mtcars.df, input$plot_brush), by = "name"),
    options = list(pageLength = 5))
}

##### Run application 
shinyApp(ui = ui, server = server)

