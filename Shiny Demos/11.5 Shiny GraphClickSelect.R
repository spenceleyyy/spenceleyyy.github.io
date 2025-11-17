## Selecting a category from a box or bar chart
# Adapted from https://shiny.rstudio.com/articles/plot-interaction-advanced.html
# "For plots that have axes with categorical values (factors or character vectors), the values returned from the browser will be numeric. 
# To compare the mouse coordinate values to the data values, you will need to coerce the data to numeric values.
# For mouse click/double-click/hover events, you will typically want to round the mouse’s x or y value so that
# it can be compared to the data values. The app below demonstrates how to do this:"

library(shiny)
library(ggplot2)
library(dplyr)

ui <- fluidPage(
  h3("Click on boxplot to select data"),
  fluidRow(
    column(6,
           plotOutput("plot1", click = "plot1_click"),
           plotOutput("plot2")
    ),
    column(5,
           br(), br(), br(),
           htmlOutput("x_value"),
           verbatimTextOutput("selected_rows")
    ))
)

server <- function(input, output) {
  
  output$plot1 <- renderPlot({
    ggplot(ToothGrowth, aes(supp,len)) + geom_boxplot()
  })
  
  output$plot2 <- renderPlot({
    if (is.null(input$plot1_click$x)) return()
    else {
      keeprows <- round(input$plot1_click$x) == as.numeric(ToothGrowth$supp)
      sub.ToothGrowth = ToothGrowth[keeprows, ]
      
      ggplot(sub.ToothGrowth, aes(len)) + geom_histogram()
    }
  })
  
  # Print the name of the x value
  output$x_value <- renderText({
    if (is.null(input$plot1_click$x)) return("")
    else {
      lvls <- levels(ToothGrowth$supp)
      name <- lvls[round(input$plot1_click$x)]
      HTML("You've selected <code>", name, "</code>",
           "<br><br>Here are the first 10 rows that ",
           "match that category:")
    }
  })
  
  # Print the rows of the data frame which match the x value
  output$selected_rows <- renderPrint({
    if (is.null(input$plot1_click$x)) return()
    else {
      keeprows <- round(input$plot1_click$x) == as.numeric(ToothGrowth$supp)
      head(ToothGrowth[keeprows, ], 10)
    }
    })
  
}

shinyApp(ui, server)
