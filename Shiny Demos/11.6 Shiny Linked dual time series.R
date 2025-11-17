
#### R Shiny example: Timelines and scatterplot ####
#### October 2020 ####
library(shiny)
library(ggplot2)
library(tidyverse)
library(data.table)

farm.df = read_csv("farm-wages.csv")
names(farm.df) = c("year", "corn.price", "corn.supply", "wages", "hog.prices", "hog.supply")


#### Define server ####
server = function(input, output){
## https://datamarket.com/data/set/22nf/farm-wages-series-with-supply-and-prices-of-hog-and-corn-series#!ds=22nf!2eko&display=line

l.cor.farm.df = as.data.frame(0:14)
names(l.cor.farm.df)= c("lag")
l.cor.farm.df$cor = 0

for (lag in 0:14) {
  cor.df = 
    farm.df%>%
    mutate(l.corn.price = lag(corn.price, n = lag)) %>%
    mutate(l.year = lag(year, n = lag), lag = lag) %>%
    filter(is.na(l.corn.price)==FALSE)%>%summarise(cor = cor(l.corn.price, wages), lag = first(lag))
  l.cor.farm.df = rbind(l.cor.farm.df, cor.df)
}



## Create lagged variables
lag.farm.df = reactive({
lag.farm.df = farm.df%>%
    mutate(l.corn.price = lag(corn.price, n = input$years_lag)) %>%
    mutate(l.year = lag(year, n = input$years_lag)) %>%
    mutate(lagged.year = year-input$years_lag) %>%
    mutate(lag = input$years_lag) %>%
    filter(is.na(l.corn.price)==FALSE)%>% 
    mutate(pred.wages = predict(lm(wages~l.corn.price)))
})


## Plot timeline for corn and wages with reference line at 1928  
output$cornTimeline = renderPlot({
  lag.farm.df()%>% 
  ggplot(aes(x = l.year, y = l.corn.price)) + geom_line() +
    geom_vline(xintercept = 1932)+ 
    xlim(c(1870-lag.farm.df()$lag[1], 1950-lag.farm.df()$lag[1])) + labs(x="", y="Lagged corn prices")
})

output$wagesTimeline = renderPlot({
  lag.farm.df()%>% 
  ggplot(aes(x = year, y = wages)) + geom_line() +
    geom_point(aes(x= year, y = pred.wages), alpha = .4)+ 
    geom_segment(aes(x=year, xend = year, y= pred.wages, yend = wages), alpha = .4)+
    geom_vline(xintercept = 1932) + geom_vline(xintercept = 1932 + input$years_lag, alpha = .5, linetype = 2) +
    xlim(1870, 1950)+ labs(x="Year", y="Wages")
})

output$wages_cornPlot = renderPlot({lag.farm.df()%>% 
  ggplot(aes(l.corn.price, wages)) + geom_point() +
    geom_smooth(colour = "darkgrey", se = FALSE)+
    geom_smooth(method ="lm") + labs(y="Wages", x="Lagged corn prices")
})

output$cor_wages_cornPlot = renderPlot({
  l.cor.farm.df%>% 
  ggplot(aes(lag, cor)) + geom_bar(stat = "identity") +
    geom_vline(xintercept = input$years_lag, size=1, colour = "darkgrey")+
    labs(y="Correlation", x="Corn price lag (years)") + theme_bw()
})

}


#### Define user interface (ui) ####
ui = shinyUI(fluidPage(
  titlePanel("R Shiny Example: Corn prices and wages"),
  p("This set of plots shows the association of two time series at different offsets or lags."),
  sidebarLayout(   
    sidebarPanel(
      sliderInput("years_lag", "Lag corn prices:", min = 0, max = 14, value = 6, round = 1),
      hr(), hr(), hr(), hr(), hr(), hr(),hr(), hr(), hr(),hr(), hr(), hr(),# Hard return to shift graph down
      plotOutput("cor_wages_cornPlot", width = 250, height = 375)
    ),
    
    mainPanel(
       plotOutput("cornTimeline", height = 200),
       plotOutput("wagesTimeline", height = 200),
       plotOutput("wages_cornPlot")
    )
  )
))


#### Run Shiny app ####
shinyApp(ui = ui, server = server)




