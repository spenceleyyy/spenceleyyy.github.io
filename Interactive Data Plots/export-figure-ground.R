library(ggplot2)
library(dplyr)
library(patchwork)
library(ggiraph)
library(htmlwidgets)

# Run from the repository root to regenerate the two self-contained widgets.
output_dir <- if (length(commandArgs(trailingOnly = TRUE))) commandArgs(trailingOnly = TRUE)[1] else "Interactive Data Plots"
dir.create(output_dir, recursive = TRUE, showWarnings = FALSE)

tx <- txhousing %>%
  group_by(city, year) %>%
  summarise(median_price = median(median, na.rm = TRUE), .groups = "drop") %>%
  filter(!is.na(median_price))
focus <- "Austin"
austin <- filter(tx, city == focus)
growth <- 100 * (austin$median_price[austin$year == 2015] /
                  austin$median_price[austin$year == 2011] - 1)

after <- ggplot(tx, aes(year, median_price / 1000, group = city)) +
  geom_line_interactive(aes(tooltip = city, data_id = city), colour = "grey85") +
  geom_line(data = austin, colour = "#0072B2", linewidth = 1.2) +
  geom_point_interactive(data = austin,
    aes(tooltip = sprintf("%s · %d\nMedian sale price: $%s", city, year,
                          format(median_price, big.mark = ",", scientific = FALSE, trim = TRUE)),
        data_id = paste(city, year)), colour = "#0072B2", size = 1.5) +
  annotate("text", x = 2015.3, y = austin$median_price[austin$year == 2015] / 1000,
           label = focus, hjust = 0, colour = "#0072B2", fontface = "bold", size = 3.5) +
  coord_cartesian(clip = "off") +
  labs(title = sprintf("After: Austin prices rose %.0f%% from 2011 to 2015", growth),
       x = NULL, y = "Median sale price ($1000s)") +
  theme_classic() +
  theme(plot.margin = margin(5, 50, 5, 5))

housing_widget <- girafe(ggobj = after, width_svg = 8, height_svg = 5.5,
  options = list(opts_hover(css = "stroke-width:2px;"), opts_toolbar(saveaspng = TRUE)))
saveWidget(housing_widget, file.path(output_dir, "austin_housing_focus.html"),
           selfcontained = TRUE, title = "Austin housing prices: figure and ground")

mtcars_named <- mtcars %>% mutate(car = rownames(mtcars),
  tooltip = sprintf("%s\nWeight: %.3f (1000 lbs)\nMiles per gallon: %.1f", car, wt, mpg))
target <- "Toyota Corolla"

pop1 <- ggplot(mtcars_named, aes(wt, mpg)) +
  geom_point_interactive(aes(tooltip = tooltip, data_id = paste0("before-", car)), size = 2) +
  labs(title = "Where is the Corolla?")

pop2 <- ggplot(mtcars_named, aes(wt, mpg)) +
  geom_point_interactive(aes(tooltip = tooltip, data_id = paste0("after-", car)),
                         size = 2, colour = "grey75") +
  geom_point_interactive(data = filter(mtcars_named, car == target),
    aes(tooltip = tooltip, data_id = paste0("after-", car)), size = 3, colour = "#D55E00") +
  annotate("text", x = 1.835 + 0.2, y = 33.9, label = target, hjust = 0,
           colour = "#D55E00", size = 3) +
  labs(title = "Colour and size make it pop out")

comparison <- (pop1 + pop2) &
  labs(x = "Weight (1000 lbs)", y = "Miles per gallon") & theme_classic(base_size = 9)
corolla_widget <- girafe(ggobj = comparison, width_svg = 10, height_svg = 4.5,
  options = list(opts_hover(css = "stroke:#172D33;stroke-width:1.5px;"),
                 opts_toolbar(saveaspng = TRUE)))
saveWidget(corolla_widget, file.path(output_dir, "corolla_popout.html"),
           selfcontained = TRUE, title = "Toyota Corolla: colour and size comparison")
