#
# This is a Shiny web application. You can run the application by clicking
# the 'Run App' button above.
#
# Find out more about building applications with Shiny here:
#
#    https://shiny.posit.co/
#

# Design intent statement: add a filter for rank, so rather than seeing all people per event, you would be abale to look at only the best performers. 
# It would be useful here to plot by the years, and then make the marks more interpretable!

library(shiny)
library(tidyverse)
library(ggiraph)

ath_df <- read_csv("all_disciplines_combined.csv")

ath_sex     <- sort(unique(ath_df$sex))
norm_disp   <- sort(unique(ath_df$normalized_discipline))
ath_age_cat <- sort(unique(ath_df$age_cat))
max_rank    <- max(ath_df$rank, na.rm = TRUE)

ui <- fluidPage(
  
  titlePanel("Athletics Data Analysis"),
  
  sidebarLayout(
    sidebarPanel(
      selectInput("athlete_sex", "Athlete sex", ath_sex),
      selectInput("athlete_age", "Age category", ath_age_cat),
      selectInput("norm_dis", "Event", norm_disp),
      sliderInput(
        "ath_rank",
        "Maximum rank",
        min   = 1,
        max   = 25,
        value = 5
      )
    ),
    
    mainPanel(
      girafeOutput("distPlot")
    )
  )
)

server <- function(input, output) {
  
  output$distPlot <- renderGirafe({
    
    cur_view_df <- ath_df %>%
      filter(
        sex == input$athlete_sex,
        age_cat == input$athlete_age,
        normalized_discipline == input$norm_dis,
        rank <= input$ath_rank
      )
    
    full_plot <- ggplot(cur_view_df,
                        aes(x = mark, y = mark_numeric)) +
      geom_point_interactive(
        aes(tooltip = competitor),
        size = 2
      ) +
      theme_bw()
    
    girafe(ggobj = full_plot)
  })
}

shinyApp(ui = ui, server = server)