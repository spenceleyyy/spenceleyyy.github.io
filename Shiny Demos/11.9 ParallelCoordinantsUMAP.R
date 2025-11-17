# This is a Shiny web application. You can run the application by clicking
# the 'Run App' button above.
# Find out more about building applications with Shiny here:
#    http://shiny.rstudio.com/

#### Load packages and process data
library(shiny)
library(tidyverse)
library(ggrepel)
library(DT)
library(uwot)

## Load libraries, load data, and transform data outside the reactive elements
mtcars.df = mtcars
mtcars.df = rownames_to_column(mtcars.df, var = "name")
l.mtcars.df = mtcars.df %>% gather(key = feature, value = value, -name)
l.mtcars.df = l.mtcars.df %>% group_by(feature) %>% mutate(s.value = scale(value)) %>% ungroup()

## Calculates UMAP dimensions for 16 combinations of important UMAP parameters 
umap_sensitivity <- function(data.df, key, y = NULL, y_weight = .5) {
  umap.df = data.frame(matrix(ncol = 4, nrow = 0))
  for (nnn in c(4, 6, 8, 12)) {
    for(dist in c(.001, .005, .01)) {
      temp = data.df %>% do(as_tibble(umap(.,
                                           n_neighbors = nnn, min_dist = dist, 
                                           y = data.df[, y], target_weight = y_weight)))
      temp[, key] = data.df[, key]
      temp$nnn = nnn
      temp$dist = dist
      umap.df = rbind(umap.df, temp)
    }
  }
  data_umap.df = left_join(data.df, umap.df, by = "name")
}

# A value of 0.0 weights only the data, and 1.0 weights only the target 
mtcars_umap.df = umap_sensitivity(mtcars.df, 
                                  key = "name", y = "mpg", y_weight = 0)


#### Define UI for application
ui <- fluidPage(
   # Application title
   titlePanel("Interactive parallel coordinate plot for mtcars data"),

   fluidRow(
     column(width = 12, class = "well",
     #sidebarPanel(p("Each point represents a car. Brush data to higlight a car or several cars.")),
    
     fluidRow(
     #  h4("      Brushed points on left graph are displayed on right graph"),
       column(width = 12,
        plotOutput(outputId = "UMAP_plot", brush = "plot_brush"),
        plotOutput(outputId = "PC_plot"),
        #width = "100%", height = "500px",
        dataTableOutput(outputId = "SelectedCars")
      )
   )
     )))



#### Calculate reactive data and create graphs and tables
server <- function(input, output) {
  
  output$UMAP_plot = renderPlot({
    ggplot(mtcars_umap.df, 
           aes(x = V1, y = V2, colour = as.factor(cyl))) + 
      geom_point(size = 2) +
      geom_point(
        data =  semi_join(mtcars_umap.df, brushedPoints(mtcars_umap.df, input$plot_brush), by = "name"),
        shape = 21, size = 4) +
      facet_grid(dist~nnn,scales = "free") + 
      theme_bw() +
      theme(legend.position = "top") 
  })
  
  output$PC_plot = renderPlot({
    ggplot(l.mtcars.df, aes(feature, s.value, group = name)) +
      geom_line(alpha = 0.3) +
      geom_line(data = semi_join(l.mtcars.df, brushedPoints(mtcars_umap.df, input$plot_brush), by = "name"),
                colour = "blue", size = 1.5) +
      geom_text_repel(
        data =  semi_join(l.mtcars.df, brushedPoints(mtcars_umap.df, input$plot_brush), by = "name") %>%
          filter(feature == "wt"),
                      aes(feature, s.value, label = name)) +
      theme_bw() +
      labs(y = "Scaled value of car feature (z-score)")
  })
  
output$SelectedCars =  renderDataTable(
    semi_join(mtcars.df, brushedPoints(mtcars_umap.df, input$plot_brush), by = "name"),
    #l.mtcars.df
    options = list(pageLength = 5))
}

##### Run application 
shinyApp(ui = ui, server = server)

