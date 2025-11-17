#
# This is a Shiny web application. You can run the application by clicking
# the 'Run App' button above.
#
# Find out more about building applications with Shiny here:
#
#    http://shiny.rstudio.com/
#

## Load libraries, load data, transform data
library(tidyverse)
library(gapminder)
library(shiny)

gapminder.df = gapminder

year.gapminder.df = gapminder.df %>% group_by(year) %>% 
    summarise(cor = cor(log(gdpPercap), lifeExp)) # Calculates correlation for each year


# Define UI for application that draws a scatterplot
ui <- fluidPage(

    # Application title
    titlePanel("Gapminder world health"),
    h3("How to select data with brushed points"), 
    p("Brush the timeline to show data in scatterplot."), # Adds text 
    p("Selecting points by brushing a graph uses code in the graph such as: "), 
    code("geom_point(data = brushedPoints(year.gapminder.df, input$plot_brush), size = 3"), ("and then 
    uses code such as:"), 
    code("semi_join(gapminder.df, brushedPoints(year.gapminder.df, input$plot_brush)"),
    ("to select a subset of data elsewhere in the app. The function"),  
    code("brushedPoints"), ("returns the dataframe of brushed points."),
    p(),

    # Sidebar with a slider input for number of bins 
    fluidRow(
        column(12,
            plotOutput(outputId = "dynamic2_plot", height = "700px")
        )
        ),

        # Show a plot of the generated distribution
    fluidRow(column(12,{
            plotOutput(outputId = "cor_plot", width = "100%", height = "100px", brush = "plot_brush")
        }
        )
    )
)

# Define server logic required to draw a histogram
server <- function(input, output) {

    output$dynamic2_plot = renderPlot({
        ggplot(data = semi_join(gapminder.df, brushedPoints(year.gapminder.df, input$plot_brush)),
               aes(gdpPercap, lifeExp, size = pop, colour = continent)) +
            geom_line(data = gapminder.df %>% filter(country == "Rwanda"), 
                      aes(gdpPercap, lifeExp), size = .5, alpha = .5) +
            geom_line(data = gapminder.df %>% filter(country == "United States"),
                      aes(gdpPercap, lifeExp), size = .5, alpha = .5) +
            geom_point(alpha = .8) +
            guides(size = FALSE) +
            coord_trans(x = "log10") +
            lims(x = c(500, 50000), y = c(20, 85)) +
            labs(title = "Life expectancy for the US and Rwanda traced",
                 x = "GDP per capita ($US)", y = "Life expectancy (Years)") +
            theme_bw(base_size = 14) +
            theme(legend.position = "top")}, height = 700)
    
    # Correlation timeline plot
    output$cor_plot <- renderPlot({
        ggplot(year.gapminder.df, aes(year, cor)) +
            geom_point() + 
            geom_line() +
            geom_point(data = brushedPoints(year.gapminder.df, input$plot_brush), size = 3) +
            labs(y = "correlation") +
            theme_minimal()
    })
}

# Run the application 
shinyApp(ui = ui, server = server)
